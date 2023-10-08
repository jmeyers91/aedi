import { Construct } from 'constructs';
import { IComputeDependency } from '../aedi-infra-types';
import { RefType, ClusterConstructRef, ClusterRef } from '@aedi/common';
import { AediBaseConstruct } from '../aedi-base-construct';
import { Stack } from 'aws-cdk-lib';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { resolveConstruct } from '../aedi-infra-utils';
import { PrivateDnsNamespace } from 'aws-cdk-lib/aws-servicediscovery';

export class AediCluster
  extends AediBaseConstruct<RefType.CLUSTER>
  implements IComputeDependency<ClusterConstructRef>
{
  public readonly clusterRef: ClusterRef;
  public readonly cluster: Cluster;
  private serviceNamespace?: PrivateDnsNamespace;

  constructor(
    scope: Construct,
    id: string,
    props: { resourceRef: ClusterRef },
  ) {
    super(scope, id, props);

    this.clusterRef = this.resourceRef;

    this.cluster = new Cluster(this, 'cluster', {
      enableFargateCapacityProviders: true,
      vpc: this.clusterRef.vpc
        ? resolveConstruct(this.clusterRef.vpc).vpc
        : undefined,
    });
  }

  /**
   * Lazily create service private DNS namespace.
   * Used to enable service discovery for services that don't use load balancers.
   */
  getServiceNamespace(): PrivateDnsNamespace {
    if (!this.serviceNamespace) {
      /**
       * Create a private DNS namespace for the cluster.
       * This will allow services to communicate with each other using private domain names.
       *
       * TODO: This should be optional. If possible, the namespace should be able to span multiple clusters.
       */
      this.serviceNamespace = new PrivateDnsNamespace(
        this,
        'service-namespace',
        {
          name:
            this.clusterRef.privateNamespace ??
            `${this.clusterRef.uid}.private`,
          vpc: this.cluster.vpc,
        },
      );
    }
    return this.serviceNamespace;
  }

  getConstructRef(): ClusterConstructRef {
    return {
      region: Stack.of(this).region,
    };
  }
}
