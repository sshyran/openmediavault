import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { marker as gettext } from '@biesbjerg/ngx-translate-extract-marker';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { EMPTY, of } from 'rxjs';
import { catchError, delay, repeat } from 'rxjs/operators';
import { concatMap } from 'rxjs/operators';

import { translate } from '~/app/i18n.helper';
import { ModalDialogComponent } from '~/app/shared/components/modal-dialog/modal-dialog.component';
import { Icon } from '~/app/shared/enum/icon.enum';
import { Notification } from '~/app/shared/models/notification.model';
import { Permissions, Roles } from '~/app/shared/models/permissions.model';
import { AuthService } from '~/app/shared/services/auth.service';
import { AuthSessionService } from '~/app/shared/services/auth-session.service';
import { LocaleService } from '~/app/shared/services/locale.service';
import { NotificationService } from '~/app/shared/services/notification.service';
import { RpcService } from '~/app/shared/services/rpc.service';
import { UserStorageService } from '~/app/shared/services/user-storage.service';

@Component({
  selector: 'omv-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit {
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('navigationSidenav')
  navigationSidenav: MatSidenav;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('notificationsSidenav')
  notificationsSidenav: MatSidenav;

  @BlockUI()
  blockUI: NgBlockUI;

  public icon = Icon;
  public currentLocale: string;
  public locales: Record<string, string> = {};
  public username: string;
  public permissions: Permissions;
  public readonly roles = Roles;
  public numNotifications: undefined | number;

  constructor(
    private router: Router,
    private authService: AuthService,
    private authSessionService: AuthSessionService,
    private rpcService: RpcService,
    private userStorageService: UserStorageService,
    private matDialog: MatDialog,
    private notificationService: NotificationService
  ) {
    this.currentLocale = LocaleService.getLocale();
    this.locales = LocaleService.getLocales();
  }

  ngOnInit(): void {
    this.username = this.authSessionService.getUsername();
    this.permissions = this.authSessionService.getPermissions();
    this.notificationService.notifications$.subscribe((notifications: Notification[]) => {
      this.numNotifications = notifications.length ? notifications.length : undefined;
    });
  }

  onToggleNavigationSidenav() {
    this.navigationSidenav.toggle();
  }

  onToggleNotificationsSidenav() {
    this.notificationsSidenav.toggle();
  }

  onLogout() {
    this.showDialog(gettext('Logout'), gettext('Do you really want to logout?'), () => {
      this.blockUI.start(translate(gettext('Please wait ...')));
      this.authService.logout().subscribe();
    });
  }

  onReboot() {
    this.showDialog(gettext('Reboot'), gettext('Do you really want to reboot the system?'), () => {
      this.rpcService.request('System', 'reboot', { delay: 0 }).subscribe(() => {
        this.blockUI.start(
          translate(gettext('The system will reboot now. This may take some time ...'))
        );
        const subscription = of(true)
          .pipe(delay(5000))
          .pipe(
            concatMap(() => this.rpcService.request('System', 'noop')),
            catchError((error) => {
              // Do not show an error notification.
              error.preventDefault();
              // If we get a HTTP 401 Unauthorized status, then unblock UI.
              if (error.status === 401) {
                subscription.unsubscribe();
                this.blockUI.stop();
              }
              return EMPTY;
            }),
            delay(500),
            repeat()
          )
          .subscribe();
      });
    });
  }

  onStandby() {
    this.showDialog(
      gettext('Standby'),
      gettext('Do you really want to put the system into standby?'),
      () => {
        this.rpcService.request('System', 'standby', { delay: 0 }).subscribe(() => {
          this.router.navigate(['/standby']);
        });
      }
    );
  }

  onShutdown() {
    this.showDialog(
      gettext('Shutdown'),
      gettext('Do you really want to shutdown the system?'),
      () => {
        this.rpcService.request('System', 'shutdown', { delay: 0 }).subscribe(() => {
          this.router.navigate(['/shutdown']);
        });
      }
    );
  }

  onLocale(locale) {
    // Update browser cookie and reload page.
    LocaleService.setLocale(locale);
    document.location.replace('');
  }

  onClearStateStorage() {
    // Clear browser cookies and reload page.
    this.showDialog(
      gettext('Reset UI to defaults'),
      gettext('Do you really want to reset the UI settings to their default values?'),
      () => {
        this.userStorageService.clear();
        document.location.replace('');
      }
    );
  }

  private showDialog(title: string, message: string, callback: () => void) {
    const dialogRef = this.matDialog.open(ModalDialogComponent, {
      data: { template: 'confirmation', title, message }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        callback();
      }
    });
  }
}
