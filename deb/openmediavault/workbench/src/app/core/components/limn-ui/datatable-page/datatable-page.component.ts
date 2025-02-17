import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as gettext } from '@biesbjerg/ngx-translate-extract-marker';
import * as _ from 'lodash';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { concat } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  AbstractPageComponent,
  PageContext
} from '~/app/core/components/limn-ui/abstract-page-component';
import { FormDialogComponent } from '~/app/core/components/limn-ui/form-dialog/form-dialog.component';
import { DatatablePageActionConfig } from '~/app/core/components/limn-ui/models/datatable-page-action-config.type';
import { DatatablePageConfig } from '~/app/core/components/limn-ui/models/datatable-page-config.type';
import { DatatablePageButtonConfig } from '~/app/core/components/limn-ui/models/datatable-page-config.type';
import { FormFieldConfig } from '~/app/core/components/limn-ui/models/form-field-config.type';
import { format, formatDeep, formatURI, isFormatable } from '~/app/functions.helper';
import { translate } from '~/app/i18n.helper';
import {
  DatatableComponent,
  IDataTableLoadParams
} from '~/app/shared/components/datatable/datatable.component';
import { ModalDialogComponent } from '~/app/shared/components/modal-dialog/modal-dialog.component';
import { TaskDialogComponent } from '~/app/shared/components/task-dialog/task-dialog.component';
import { Icon } from '~/app/shared/enum/icon.enum';
import { NotificationType } from '~/app/shared/enum/notification-type.enum';
import { DatatableSelection } from '~/app/shared/models/datatable-selection.model';
import { RpcListResponse } from '~/app/shared/models/rpc.model';
import { AuthSessionService } from '~/app/shared/services/auth-session.service';
import { DataStoreService } from '~/app/shared/services/data-store.service';
import { NotificationService } from '~/app/shared/services/notification.service';
import { RpcService } from '~/app/shared/services/rpc.service';

@Component({
  selector: 'omv-limn-datatable-page',
  templateUrl: './datatable-page.component.html',
  styleUrls: ['./datatable-page.component.scss']
})
export class DatatablePageComponent extends AbstractPageComponent<DatatablePageConfig> {
  @BlockUI()
  blockUI: NgBlockUI;

  @ViewChild('table', { static: true })
  table: DatatableComponent;

  public loading = false;
  public count = 0;
  public selection = new DatatableSelection();

  constructor(
    @Inject(ActivatedRoute) activatedRoute: ActivatedRoute,
    @Inject(AuthSessionService) authSessionService: AuthSessionService,
    private dataStoreService: DataStoreService,
    private router: Router,
    private rpcService: RpcService,
    private matDialog: MatDialog,
    private notificationService: NotificationService
  ) {
    super(activatedRoute, authSessionService);
  }

  /**
   * Append the current selection to the page context.
   */
  get pageContext(): PageContext {
    const result = _.merge(
      {
        _selected: this.selection.selected
      },
      super.pageContext
    );
    return result;
  }

  loadData(params: IDataTableLoadParams) {
    const store = this.config.store;
    if (_.isPlainObject(store.proxy)) {
      _.defaultsDeep(store.proxy.get, {
        params: {
          start: 0,
          limit: -1
        }
      });
      // Convert paging and sorting parameters.
      if (_.isNumber(params.offset) && _.isNumber(params.limit)) {
        _.merge(store.proxy.get.params, {
          start: params.offset * params.limit,
          limit: params.limit
        });
      }
      if (_.isString(params.dir) && _.isString(params.prop)) {
        _.merge(store.proxy.get.params, {
          sortdir: params.dir,
          sortfield: params.prop
        });
      }
    }
    this.loading = true;
    this.dataStoreService
      .load(store)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (res: RpcListResponse) => {
          // Update the total count of all rows.
          if (_.isPlainObject(store.proxy)) {
            this.count = res.total;
          }
        },
        () => {
          // Reset store and table in case of an error.
          store.data = [];
          this.count = 0;
        }
      );
  }

  /**
   * Reload the data to refresh/update the datatable content.
   */
  reloadData() {
    this.table.reloadData();
  }

  onSelectionChange(selection: DatatableSelection) {
    this.selection = selection;
  }

  onActionClick(action: DatatablePageActionConfig, selection: DatatableSelection): void {
    const postConfirmFn = () => {
      switch (action?.execute?.type) {
        case 'url':
          // Encode each value to ensure we can safely use them as
          // URL parameters.
          const url = formatURI(action.execute.url, this.pageContext);
          this.router.navigate([url]);
          break;
        case 'request':
          const observables = [];
          const request = action.execute.request;
          if (selection.hasSelection) {
            selection.selected.forEach((selected) => {
              const params = formatDeep(request.params, _.merge({}, this.pageContext, selected));
              observables.push(
                this.rpcService[request.task ? 'requestTask' : 'request'](
                  request.service,
                  request.method,
                  params
                )
              );
            });
          } else {
            const params = formatDeep(request.params, this.pageContext);
            observables.push(
              this.rpcService[request.task ? 'requestTask' : 'request'](
                request.service,
                request.method,
                params
              )
            );
          }
          // Block UI and display the progress message.
          if (_.isString(request.progressMessage)) {
            this.blockUI.start(translate(request.progressMessage));
          }
          // Process each request one-by-one (NOT in parallel).
          concat(...observables)
            .pipe(
              finalize(() => {
                if (_.isString(request.progressMessage)) {
                  this.blockUI.stop();
                }
              })
            )
            .subscribe(() => {
              // Display a notification?
              if (_.isString(request.successNotification)) {
                const message = format(
                  request.successNotification,
                  _.merge(
                    {},
                    this.pageContext,
                    selection.hasSingleSelection ? selection.first() : {}
                  )
                );
                this.notificationService.show(NotificationType.success, message);
              }
              this.reloadData();
            });
          break;
        case 'taskDialog':
          const taskDialogConfig = _.cloneDeep(action.execute.taskDialog);
          // Process tokenized configuration properties.
          _.forEach(['request.params'], (path) => {
            const value = _.get(taskDialogConfig, path);
            if (isFormatable(value)) {
              _.set(taskDialogConfig, path, formatDeep(value, this.pageContext));
            }
          });
          const taskDialog = this.matDialog.open(TaskDialogComponent, {
            width: _.get(taskDialogConfig, 'width', '50%'),
            data: _.omit(taskDialogConfig, ['width'])
          });
          // Reload datatable if pressed button returns `true`.
          taskDialog.afterClosed().subscribe((res) => res && this.reloadData());
          break;
        case 'formDialog':
          const formDialogConfig = _.cloneDeep(action.execute.formDialog);
          // Process tokenized form field properties.
          _.forEach(formDialogConfig.fields, (fieldConfig: FormFieldConfig) => {
            _.forEach(['store.proxy', 'store.filters', 'value', 'request.params'], (path) => {
              const value = _.get(fieldConfig, path);
              if (isFormatable(value)) {
                _.set(fieldConfig, path, formatDeep(value, this.pageContext));
              }
            });
          });
          const formDialog = this.matDialog.open(FormDialogComponent, {
            width: _.get(formDialogConfig, 'width', '50%'),
            data: _.omit(formDialogConfig, ['width'])
          });
          // Reload datatable if pressed button returns `true`.
          formDialog.afterClosed().subscribe((res) => res && this.reloadData());
          break;
      }
    };
    // Must the user confirm the action?
    if (_.isPlainObject(action.confirmationDialogConfig)) {
      const data = _.cloneDeep(action.confirmationDialogConfig);
      if (_.isString(data.message)) {
        data.message = format(data.message, this.pageContext);
      }
      const dialogRef = this.matDialog.open(ModalDialogComponent, { data });
      dialogRef.afterClosed().subscribe((res) => {
        if (true === res) {
          postConfirmFn();
        }
      });
    } else {
      postConfirmFn();
    }
  }

  onButtonClick(buttonConfig: DatatablePageButtonConfig) {
    if (_.isFunction(buttonConfig.click)) {
      buttonConfig.click(buttonConfig, this.config.store);
    } else {
      const url = formatURI(buttonConfig.url, this.pageContext);
      this.router.navigate([url]);
    }
  }

  protected sanitizeConfig() {
    _.defaultsDeep(this.config, {
      columnMode: 'flex',
      hasActionBar: true,
      hasHeader: true,
      hasFooter: true,
      selectionType: 'multi',
      updateSelectionOnReload: 'always',
      rowId: 'uuid',
      limit: 25,
      remotePaging: false,
      remoteSorting: false,
      autoLoad: true,
      autoReload: false,
      columns: [],
      actions: [],
      sorters: [],
      buttonAlign: 'left',
      buttons: []
    });
    // Map icon from 'foo' to 'mdi:foo' if necessary.
    this.config.icon = _.get(Icon, this.config.icon, this.config.icon);
    // Pre-setup actions based on the specified template type.
    this.sanitizeActions(this.config.actions);
  }

  protected onRouteParams() {
    // Format tokenized configuration properties.
    this.formatConfig([
      'title',
      'subTitle',
      'store.proxy.service',
      'store.proxy.get.method',
      'store.proxy.get.params',
      'store.filters'
    ]);
  }

  private sanitizeActions(actions) {
    _.forEach(actions, (action: DatatablePageActionConfig) => {
      _.defaultsDeep(action, {
        click: this.onActionClick.bind(this)
      });
      if (_.isArray(action.actions)) {
        this.sanitizeActions(action.actions);
      }
      // Map icon from 'foo' to 'mdi:foo' if necessary.
      action.icon = _.get(Icon, action.icon, action.icon);
      // Process templates.
      switch (action.template) {
        case 'add':
          _.defaultsDeep(action, {
            id: 'add',
            type: 'iconButton',
            text: gettext('Add'),
            tooltip: gettext('Add'),
            icon: Icon.add
          });
          break;
        case 'create':
          _.defaultsDeep(action, {
            id: 'create',
            type: 'iconButton',
            text: gettext('Create'),
            tooltip: gettext('Create'),
            icon: Icon.add
          });
          break;
        case 'edit':
          _.defaultsDeep(action, {
            id: 'edit',
            type: 'iconButton',
            text: gettext('Edit'),
            tooltip: gettext('Edit'),
            icon: Icon.edit,
            enabledConstraints: {
              minSelected: 1,
              maxSelected: 1
            }
          });
          break;
        case 'delete':
          _.defaultsDeep(action, {
            id: 'delete',
            type: 'iconButton',
            text: gettext('Delete'),
            tooltip: gettext('Delete'),
            icon: Icon.delete,
            enabledConstraints: {
              minSelected: 1
            },
            confirmationDialogConfig: {
              template: 'confirmation',
              title: gettext('Delete'),
              message: gettext('Do you really want to delete the selected item(s)?'),
              buttons: [{}, { class: 'omv-background-color-theme-red' }]
            },
            execute: {
              request: {
                progressMessage: gettext('Please wait, deleting selected item(s) ...')
              }
            }
          });
          break;
        default:
          _.defaultsDeep(action, {
            execute: {
              request: {
                progressMessage: gettext('Please wait, processing selected item(s) ...')
              }
            }
          });
          break;
      }
    });
  }
}
