import { Component } from '@angular/core';
import { marker as gettext } from '@biesbjerg/ngx-translate-extract-marker';

import { DatatablePageConfig } from '~/app/core/components/limn-ui/models/datatable-page-config.type';

@Component({
  template: '<omv-limn-datatable-page [config]="this.config"></omv-limn-datatable-page>'
})
export class SshCertificateDatatablePageComponent {
  public config: DatatablePageConfig = {
    stateId: '85efa226-1c32-11ea-8f7a-67b9a1e57494',
    columns: [{ name: gettext('Comment'), prop: 'comment', flexGrow: 1, sortable: true }],
    sorters: [
      {
        dir: 'asc',
        prop: 'comment'
      }
    ],
    store: {
      proxy: {
        service: 'CertificateMgmt',
        get: {
          method: 'getSshList'
        }
      }
    },
    actions: [
      {
        type: 'menu',
        icon: 'add',
        actions: [
          {
            template: 'create',
            execute: {
              type: 'url',
              url: '/system/certificate/ssh/create'
            }
          },
          {
            type: 'iconButton',
            text: gettext('Import'),
            icon: 'import',
            execute: {
              type: 'url',
              url: '/system/certificate/ssh/import'
            }
          }
        ]
      },
      {
        template: 'edit',
        execute: {
          type: 'url',
          url: '/system/certificate/ssh/edit/{{ _selected[0].uuid }}'
        }
      },
      {
        type: 'iconButton',
        icon: 'copy',
        tooltip: gettext('Copy'),
        enabledConstraints: {
          minSelected: 1,
          maxSelected: 1
        },
        execute: {
          type: 'formDialog',
          formDialog: {
            title: gettext('Copy public SSH key'),
            subTitle: gettext(
              // eslint-disable-next-line max-len
              'Installs the public SSH key on a remote system as an authorized key. Make sure password authentication is enabled on that remote system.'
            ),
            fields: [
              {
                type: 'hidden',
                name: 'uuid',
                value: '{{ _selected[0].uuid }}'
              },
              {
                type: 'textInput',
                name: 'hostname',
                label: gettext('Hostname'),
                hint: gettext('The hostname of the remote system.'),
                value: '',
                validators: {
                  required: true
                }
              },
              {
                type: 'numberInput',
                name: 'port',
                label: gettext('Port'),
                hint: gettext('The port on which SSH is running on the remote system.'),
                value: 22,
                validators: {
                  required: true,
                  patternType: 'port'
                }
              },
              {
                type: 'textInput',
                name: 'username',
                label: gettext('Username'),
                value: '',
                autocomplete: 'username',
                validators: {
                  required: true
                }
              },
              {
                type: 'passwordInput',
                name: 'password',
                label: gettext('Password'),
                value: '',
                autocomplete: 'new-password'
              }
            ],
            buttons: {
              submit: {
                text: gettext('Copy'),
                execute: {
                  type: 'request',
                  request: {
                    service: 'CertificateMgmt',
                    method: 'copySshId',
                    progressMessage: gettext(
                      'Please wait, installing public SSH key on remote system ...'
                    ),
                    successNotification: gettext('Copied SSH certificate to {{ hostname }}.')
                  }
                }
              }
            }
          }
        }
      },
      {
        template: 'delete',
        execute: {
          type: 'request',
          request: {
            service: 'CertificateMgmt',
            method: 'deleteSsh',
            params: {
              uuid: '{{ _selected[0].uuid }}'
            }
          }
        }
      }
    ]
  };
}
