import { Component, OnInit } from '@angular/core';
import { marker as gettext } from '@biesbjerg/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import * as _ from 'lodash';

import { DatatablePageConfig } from '~/app/core/components/limn-ui/models/datatable-page-config.type';
import { format } from '~/app/functions.helper';
import { BinaryUnitPipe } from '~/app/shared/pipes/binary-unit.pipe';
import {
  SystemInformation,
  SystemInformationService
} from '~/app/shared/services/system-information.service';

@Component({
  template: '<omv-limn-datatable-page [config]="this.config"></omv-limn-datatable-page>'
})
export class SystemInformationDatatablePageComponent implements OnInit {
  public config: DatatablePageConfig = {
    limit: 0,
    autoReload: false,
    hasActionBar: false,
    hasHeader: false,
    hasFooter: false,
    selectionType: 'none',
    columns: [
      {
        prop: 'name',
        flexGrow: 1,
        cellClass: 'omv-text-bold',
        cellTemplateName: 'template',
        cellTemplateConfig: '{{ name | translate }}'
      },
      {
        prop: 'value',
        flexGrow: 3,
        cellTemplateName: 'shapeShifter'
      }
    ],
    store: {
      data: [],
      fields: ['name', 'value']
    }
  };

  constructor(
    private binaryUnitPipe: BinaryUnitPipe,
    private systemInformationService: SystemInformationService
  ) {}

  ngOnInit(): void {
    this.systemInformationService.systemInfo$.subscribe((res: SystemInformation) => {
      const data = [];
      const rows = {
        hostname: {
          name: gettext('Hostname'),
          value: {
            type: 'text',
            value: _.get(res, 'hostname')
          }
        },
        version: {
          name: gettext('Version'),
          value: {
            type: 'text',
            value: _.get(res, 'version')
          }
        },
        cpuModelName: {
          name: gettext('Processor'),
          value: {
            type: 'text',
            value: _.get(res, 'cpuModelName')
          }
        },
        kernel: {
          name: gettext('Kernel'),
          value: {
            type: 'text',
            value: _.get(res, 'kernel')
          }
        },
        time: {
          name: gettext('System Time'),
          value: {
            type: 'localeDateTime',
            value: _.get(res, 'ts')
          }
        },
        uptime: {
          name: gettext('Uptime'),
          value: {
            type: 'relativeTime',
            value: dayjs().unix() - _.get(res, 'uptime')
          }
        },
        loadAverage: {
          name: gettext('Load Average'),
          value: {
            type: 'text',
            value: format(
              '{{ loadAverage.1min | tofixed(2) }}, {{ loadAverage.5min | tofixed(2) }}, {{ loadAverage.15min | tofixed(2) }}',
              res
            )
          }
        },
        cpuUsage: {
          name: gettext('CPU Usage'),
          value: {
            type: 'progressBar',
            text: `${res.cpuUsage?.toFixed(1)}%`,
            value: res.cpuUsage?.toFixed(1)
          }
        },
        memUsed: {
          name: gettext('Memory Usage'),
          value: {
            type: 'progressBar',
            text: `${(res.memUsed / res.memTotal).toFixed(1)}% of ${this.binaryUnitPipe.transform(
              res.memTotal
            )}`,
            value: (res.memUsed / res.memTotal).toFixed(1)
          }
        }
      };
      _.forEach(rows, (value: Record<any, any>, key: string) => {
        if (_.has(res, key)) {
          data.push(value);
        }
      });
      this.config.store.data = data;
    });
  }
}
