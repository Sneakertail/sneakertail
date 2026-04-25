# Dev And Prod Governance

## Working Branch

- Day-to-day work happens on `dev`.
- `main` is release-only.

## Branch Protection To Add In GitHub

Apply these rules in every repo that deploys Sneakertail:

1. Protect `main`.
2. Require a pull request before merging.
3. Require at least 1 approval.
4. Dismiss stale approvals when new commits are pushed.
5. Require status checks before merge:
   - `quality-and-security`
   - `build-and-push-dev` on `dev`
   - `build-and-push-prod` on the manual prod workflow for release PRs
6. Block direct pushes to `main`.
7. Optionally restrict who can bypass branch protection to repo admins only.

## Prod Approval Model

- Prod workflows are manual only through `workflow_dispatch`.
- The prod job uses the GitHub `prod` environment.
- In GitHub, set `Settings -> Environments -> prod` with required reviewers.
- Do not allow self-review for prod approval.

## CI Secrets And Variables

Add these in each service repo and the frontend repo:

- Secret: `SONAR_TOKEN`
- Secret: `SNYK_TOKEN`
- Variable: `SONAR_HOST_URL`

## Kubernetes Secret Values

Do not commit real secret values into git. Create them in cluster or pass them through Helm values outside the repo.

### Generate strong values

PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Apply directly with kubectl

```powershell
kubectl create namespace k8s

kubectl -n k8s create secret generic auth-service-secret `
  --from-literal=JWT_SECRET='replace-with-generated-value' `
  --from-literal=ADMIN_PASSWORD='replace-with-admin-password' `
  --from-literal=DEMO_PASSWORD='replace-with-demo-password' `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n k8s create secret generic product-service-secret `
  --from-literal=DB_PASSWORD='replace-with-postgres-password' `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n k8s create secret generic interaction-service-secret `
  --from-literal=DB_PASSWORD='replace-with-postgres-password' `
  --dry-run=client -o yaml | kubectl apply -f -
```

### Helm values file

Use `sneakertail-charts/values-secrets.example.yaml` as the template and keep the real file outside git.

## Nginx In Front Of The Frontend

With `GoDaddy -> HAProxy -> kgateway -> HTTPRoute`, NGINX is not required as an ingress layer.

It is still useful in the current frontend container because it does two app-level jobs:

1. Serves the built React files.
2. Proxies `/api/*` calls to in-cluster services so the browser stays on one origin.

If you move both of those concerns into kgateway or another web server, you can remove NGINX from the frontend image. With the current repo layout, keeping it is the simpler option.
