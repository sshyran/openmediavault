import { Component } from '@angular/core';
import { marker as gettext } from '@biesbjerg/ngx-translate-extract-marker';

import { DatatablePageConfig } from '~/app/core/components/limn-ui/models/datatable-page-config.type';

@Component({
  template: '<omv-limn-datatable-page [config]="this.config"></omv-limn-datatable-page>'
})
export class UserDatatablePageComponent {
  public config: DatatablePageConfig = {
    stateId: '9dd2c07e-4572-4112-9de7-c3ccad5ef52e',
    autoReload: false,
    remoteSorting: true,
    remotePaging: true,
    hasSearchField: true,
    rowId: 'name',
    columns: [
      { name: gettext('Name'), prop: 'name', flexGrow: 1, sortable: true },
      { name: gettext('Email'), prop: 'email', flexGrow: 1, sortable: true },
      {
        name: gettext('Groups'),
        prop: 'groups',
        flexGrow: 1,
        sortable: true,
        cellTemplateName: 'template',
        cellTemplateConfig: '{{ groups | sort() | join(", ") }}'
      },
      { name: gettext('Comment'), prop: 'comment', flexGrow: 1, sortable: true }
    ],
    sorters: [
      {
        dir: 'asc',
        prop: 'name'
      }
    ],
    store: {
      proxy: {
        service: 'UserMgmt',
        get: {
          method: 'getUserList'
        }
      }
    },
    actions: [
      {
        type: 'menu',
        icon: 'add',
        tooltip: gettext('Create'),
        actions: [
          {
            template: 'create',
            execute: {
              type: 'url',
              url: '/usermgmt/users/create'
            }
          },
          {
            type: 'iconButton',
            text: gettext('Import'),
            icon: 'import',
            execute: {
              type: 'url',
              url: '/usermgmt/users/import'
            }
          }
        ]
      },
      {
        template: 'edit',
        execute: {
          type: 'url',
          url: '/usermgmt/users/edit/{{ _selected[0].name }}'
        }
      },
      {
        type: 'iconButton',
        icon: 'mdi:folder-key',
        tooltip: gettext('Shared folder privileges'),
        enabledConstraints: {
          minSelected: 1,
          maxSelected: 1
        },
        execute: {
          type: 'url',
          url: '/usermgmt/users/privileges/{{ _selected[0].name }}'
        }
      },
      {
        template: 'delete',
        execute: {
          type: 'request',
          request: {
            service: 'UserMgmt',
            method: 'deleteUser',
            params: {
              name: '{{ _selected[0].name }}'
            }
          }
        }
      }
    ]
  };
}
