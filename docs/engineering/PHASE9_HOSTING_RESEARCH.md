# Hosting feasibility — checked 16 October 2026

No infrastructure was provisioned or published. No free capacity is verified for
this account. Do not treat the options below as a selected, running deployment.

## No-initial-charge candidate

Self-managed K3s on an OCI Always Free eligible A1 VM is a candidate Kubernetes
architecture, conditional on account eligibility and regional capacity. Current
Oracle documentation lists 1,500 OCPU-hours and 9,000 GB-hours monthly, equivalent
to 2 OCPUs/12 GB RAM; 200 GB total block storage includes VM boot volumes. This
is not the older 4-core/24-GB allowance. Always Free resources must be provisioned
in the tenancy home region. Idle instances can be reclaimed after the documented
seven-day utilization test. Capacity errors are possible. Card identity verification
is required; signup can cause a temporary authorization hold. No guarantee of
always-on availability or permanent unchanged quotas is possible.

Sources:
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://www.oracle.com/cloud/free/

The candidate would host ingress/TLS, one active coordinator, static web service,
MySQL StatefulSet/PVC and separately bounded execution services. DNS, registry,
backup object storage, egress and certificate issuance must be verified against
actual account limits before approval. Public TCP443 permits HTTPS/WSS from
unrelated networks; it is not tied to a development laptop. MySQL is never public.
ARM requires actually built/tested ARM images and compatible execution artifacts;
existing Windows packages are not server/container images.

## Managed Kubernetes alternative

GKE advertises $74.40 monthly credits toward eligible cluster management charges,
not free worker compute/storage/networking. It is not a demonstrated zero-cost
always-on cluster/database/ingress solution for this project. Billing, node compute,
disks, public networking, load-balancing and usage above credits can cost money.
No account or paid resource was created.

Sources:
- https://cloud.google.com/kubernetes-engine/pricing
- https://docs.cloud.google.com/free/docs/free-cloud-features

## Required next external decision

Supply a provider and authorized cluster context, domain/DNS access, storage class,
ingress/certificate approach, backup location and explicit permission to publish.
Configure secrets through the provider/cluster tooling, not chat or Git. Confirm
the current cost estimate in that account before provisioning anything. If no
free capacity is available, either authorize a budget separately or use local
Kubernetes for manifest validation only. Local Kubernetes does not pass public
internet joining or laptop-off availability acceptance.

## Current execution blocker

The coordinator's Docker-based program execution needs a Kubernetes-compatible
bounded execution adapter. Mounting /var/run/docker.sock gives host-level control
and is not an acceptable shortcut. Disabling program execution and advertising
full compiler execution is also unacceptable. Until the adapter and deployment
are tested, public compiler execution remains unverified.
