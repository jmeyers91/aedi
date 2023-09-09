import { Construct } from 'constructs';
import { DomainPair } from '@sep6/utils';
import { DomainId } from '@sep6/constants';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { App, Stack } from 'aws-cdk-lib';

export type DomainMap = {
  [K in DomainId]?: DomainPair;
};

export interface CertifiedDomain {
  domain: DomainId;
  domainPair: DomainPair;
  certificate: Certificate;
  hostedZone: IHostedZone;
}

/**
 * Handles translating domains into certificates.
 */
export class DnsManager extends Construct {
  private readonly crossRegionStacks = new Map<string, Stack>();
  private readonly domainCerts = new Map<
    DomainId,
    { certificate: Certificate; hostedZone: IHostedZone }
  >();
  private readonly domainHostedZones = new Map<
    Construct,
    Map<DomainId, IHostedZone>
  >();

  constructor(
    scope: Construct,
    id: string,
    private readonly props: {
      app: App;
      domains: DomainMap;
    }
  ) {
    super(scope, id);
  }

  getDomainPair(domain: DomainId | null | undefined): DomainPair | undefined {
    if (!domain) {
      return undefined;
    }
    return this.props.domains[domain];
  }

  getDomainName(domain: DomainId | null | undefined): string | undefined {
    return this.getDomainPair(domain)?.domainName;
  }

  getDomainZone(domain: DomainId | null | undefined): string | undefined {
    return this.getDomainPair(domain)?.domainZone;
  }

  getDomainHostedZone(
    scope: Construct,
    domain: DomainId,
    domainPair: DomainPair
  ): IHostedZone {
    let scopeHostedZones = this.domainHostedZones.get(scope);
    if (!scopeHostedZones) {
      scopeHostedZones = new Map();
      this.domainHostedZones.set(scope, scopeHostedZones);
    }
    let hostedZone = scopeHostedZones.get(domain);
    if (!hostedZone) {
      hostedZone = HostedZone.fromLookup(scope, `${domain}-hosted-zone`, {
        domainName: domainPair.domainZone,
      });
      scopeHostedZones.set(domain, hostedZone);
    }
    return hostedZone;
  }

  getDomainCert(
    domain: DomainId | null | undefined,
    { region }: { region?: string } = {}
  ): CertifiedDomain | undefined {
    if (!domain) {
      return undefined;
    }
    const domainPair = this.getDomainPair(domain);
    if (!domainPair) {
      return undefined;
    }

    let cached = this.domainCerts.get(domain);
    if (!cached) {
      const certScope = this.getCertScope({ region });
      const hostedZone = this.getDomainHostedZone(
        certScope,
        domain,
        domainPair
      );
      const certificate = new Certificate(
        certScope,
        `${domain.toLowerCase().replace(/_/g, '-')}`,
        {
          domainName: domainPair.domainName,
          validation: CertificateValidation.fromDns(
            this.getDomainHostedZone(certScope, domain, domainPair)
          ),
        }
      );
      cached = { certificate, hostedZone };
      this.domainCerts.set(domain, cached);
    }

    const { certificate, hostedZone } = cached;
    return { certificate, hostedZone, domain, domainPair };
  }

  getCertScope({ region }: { region?: string }) {
    if (!region) {
      // Default to the current construct
      return this;
    }
    let stack = this.crossRegionStacks.get(region);
    if (!stack) {
      stack = new Stack(
        this.props.app,
        `${Stack.of(this).stackId}-${region}-certs`,
        { crossRegionReferences: true }
      );
      this.crossRegionStacks.set(region, stack);
    }
    return stack;
  }
}
