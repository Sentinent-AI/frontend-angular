import { TestBed } from '@angular/core/testing';
import { IntegrationService } from './integration.service';

describe('IntegrationService', () => {
  let service: IntegrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntegrationService);
  });

  it('connects Slack and exposes workspace details', () => {
    let connected = false;
    let workspaceName: string | undefined;

    service.connectSlack().subscribe(result => {
      connected = result.connected;
    });
    service.getSlackChannels().subscribe(result => {
      workspaceName = result.workspaceName;
    });

    expect(connected).toBeTrue();
    expect(workspaceName).toBe('Sentinent Ops');
  });

  it('updates Slack channel selections', () => {
    let connectedChannels: string[] = [];

    service.updateSlackChannels(['C987654']).subscribe();
    service.getSlackChannels().subscribe(result => {
      connectedChannels = result.channels.filter(channel => channel.isConnected).map(channel => channel.id);
    });

    expect(connectedChannels).toEqual(['C987654']);
  });

  it('disconnects Slack and clears all connected channels', () => {
    let connected = true;
    let connectedChannels = 1;

    service.connectSlack().subscribe();
    service.disconnectSlack().subscribe();
    service.getSlackChannels().subscribe(result => {
      connected = result.connected;
      connectedChannels = result.channels.filter(channel => channel.isConnected).length;
    });

    expect(connected).toBeFalse();
    expect(connectedChannels).toBe(0);
  });

  it('returns an error when GitHub sync is requested before connection', () => {
    let errorMessage = '';

    service.syncGitHub().subscribe({
      next: () => fail('expected syncGitHub to fail when GitHub is disconnected'),
      error: error => {
        errorMessage = error.message;
      }
    });

    expect(errorMessage).toContain('Connect GitHub');
  });

  it('syncs connected GitHub repositories and exposes the sync status', () => {
    let syncId = '';
    let itemsSynced = 0;

    service.connectGitHub().subscribe();
    service.updateGitHubRepos([101, 103]).subscribe();
    service.syncGitHub().subscribe(result => {
      syncId = result.syncId;
    });
    service.getSyncStatus(syncId).subscribe(result => {
      itemsSynced = result.itemsSynced ?? 0;
    });

    expect(syncId).toContain('sync-');
    expect(itemsSynced).toBe(12);
  });

  it('disconnects GitHub and clears the latest sync state', () => {
    let status = 'unknown';

    service.connectGitHub().subscribe();
    service.syncGitHub().subscribe(result => {
      service.disconnectGitHub().subscribe();
      service.getSyncStatus(result.syncId).subscribe(syncStatus => {
        status = syncStatus.status;
      });
    });

    expect(status).toBe('failed');
  });
});
