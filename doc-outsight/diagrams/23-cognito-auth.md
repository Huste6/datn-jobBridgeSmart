# 23 — Amazon Cognito Authentication

> Toàn bộ luồng xác thực: Sign-up, Sign-in, JWT flow, Lambda triggers, RBAC

---

## 23a — Cognito Components Overview

```mermaid
graph TB
    subgraph COGNITO["🔐 Amazon Cognito"]

        subgraph USER_POOL["User Pool\n(jobbridge-users)"]
            UP_DIR["👥 User Directory\n(job seekers, employers, admins)"]
            UP_MFA["📱 MFA\n(TOTP / SMS)"]
            UP_UI["🖥️ Hosted UI\n(login / signup page)"]
            UP_CLIENT["📱 App Client\n(Frontend SPA)"]
            UP_SOCIAL["🔗 Identity Federation\n(Google, LinkedIn)"]
        end

        subgraph ID_POOL["Identity Pool\n(jobbridge-identity)"]
            IP_CREDS["☁️ Temp AWS Credentials\n(via STS AssumeRoleWithWebIdentity)"]
            IP_AUTH["Role: CognitoAuthRole\n(authenticated users)"]
            IP_UNAUTH["Role: CognitoUnauthRole\n(guest — public jobs)"]
        end
    end

    subgraph LAMBDA_TRIGGERS["λ Lambda Triggers (User Pool)"]
        LT1["Pre Sign-up\n→ validate email domain\n→ block disposable emails"]
        LT2["Post Confirmation\n→ tạo user profile trong RDS\n→ gửi welcome email via SES"]
        LT3["Pre Token Generation\n→ thêm custom claims:\n  role: job_seeker/employer/admin\n  userId, planTier"]
        LT4["Post Authentication\n→ cập nhật last_login trong RDS"]
        LT5["Pre Authentication\n→ check account status\n  (banned/suspended → block)"]
    end

    USER_POOL -->|"issue JWT"| LAMBDA_TRIGGERS
    USER_POOL -->|"swap JWT → AWS creds"| ID_POOL
```

---

## 23b — Sign-up & Sign-in Flow

```mermaid
sequenceDiagram
    actor U as 👤 User
    participant FE as ⚛️ Frontend (React)
    participant CUP as 🔐 Cognito User Pool
    participant L_PRE as λ Pre Sign-up
    participant L_POST as λ Post Confirmation
    participant RDS as 🐘 RDS PostgreSQL
    participant SES as ✉️ Amazon SES

    Note over U, SES: ── SIGN-UP FLOW ──
    U->>FE: Điền form đăng ký
    FE->>CUP: SignUp(email, password, role)
    CUP->>L_PRE: trigger Pre Sign-up
    L_PRE-->>CUP: ✅ validate OK
    CUP-->>FE: Gửi verification code (email)
    U->>FE: Nhập verification code
    FE->>CUP: ConfirmSignUp(code)
    CUP->>L_POST: trigger Post Confirmation
    L_POST->>RDS: INSERT user_profiles (userId, role, email)
    L_POST->>SES: Gửi welcome email
    CUP-->>FE: ✅ Account confirmed

    Note over U, SES: ── SIGN-IN FLOW ──
    U->>FE: Nhập email + password
    FE->>CUP: InitiateAuth(email, password)
    CUP->>L_PRE: trigger Pre Authentication
    L_PRE-->>CUP: ✅ account active
    CUP-->>FE: Challenge MFA (nếu bật)
    FE->>CUP: RespondToAuthChallenge(MFA code)
    CUP->>L_POST: trigger Pre Token Generation
    L_POST-->>CUP: custom claims (role, userId)
    CUP-->>FE: ✅ JWT Tokens\n(AccessToken + IDToken + RefreshToken)
```

---

## 23c — API Call với JWT (Token Validation Flow)

```mermaid
graph LR
    FE["⚛️ Frontend\n(React)"]
    ALB["⚖️ ALB\n+ Cognito Authenticator"]
    CUP["🔐 Cognito\nUser Pool\n(JWKS endpoint)"]
    GW["🔀 API Gateway\n(Node.js/Go)"]
    AUTH_SVC["🔐 Auth Service\n(RBAC check)"]
    RESOURCE["💼 Job Service\n/ AI Service"]

    FE -->|"1. Request + Bearer AccessToken"| ALB
    ALB -->|"2. Validate JWT\n(check signature via JWKS)"| CUP
    CUP -->|"3. ✅ Valid token\n(claims: userId, role, exp)"| ALB
    ALB -->|"4. Forward request\n+ inject headers:\nX-User-Id, X-User-Role"| GW
    GW -->|"5. Check RBAC\n(employer can POST job?\njob seeker can apply?)"| AUTH_SVC
    AUTH_SVC -->|"6. ✅ Authorized"| RESOURCE
    RESOURCE -->|"7. Response"| FE
```

---

## 23d — Token Refresh Flow

```mermaid
graph LR
    FE["⚛️ Frontend"]
    CUP["🔐 Cognito User Pool"]
    STORE["💾 Browser Storage\n(AccessToken: memory\nRefreshToken: httpOnly cookie)"]

    FE -->|"1. AccessToken expired (1h)"| FE
    FE -->|"2. InitiateAuth(REFRESH_TOKEN)"| CUP
    CUP -->|"3. ✅ New AccessToken + IDToken\n(RefreshToken vẫn dùng được 30d)"| FE
    FE --> STORE

    REVOKE["🚫 Logout / Revoke"]
    FE -->|"4. GlobalSignOut()"| CUP
    CUP -->|"5. Revoke tất cả tokens"| REVOKE
```

---

## 23e — Social Login (Google / LinkedIn)

```mermaid
graph LR
    U["👤 User"]
    FE["⚛️ Frontend"]
    CUP["🔐 Cognito User Pool\n(Hosted UI)"]
    GOOGLE["🟢 Google OAuth2"]
    LINKEDIN["🔵 LinkedIn OAuth2"]
    L_POST["λ Post Confirmation\n(tạo profile nếu user mới)"]
    RDS[("🐘 RDS")]

    U -->|"Click 'Login with Google'"| FE
    FE -->|"Redirect to Cognito Hosted UI"| CUP
    CUP -->|"Redirect to Google"| GOOGLE
    GOOGLE -->|"Authorization code"| CUP
    CUP -->|"Exchange for Google profile"| GOOGLE
    CUP -->|"Tạo/link Cognito user"| L_POST
    L_POST --> RDS
    CUP -->|"✅ JWT Tokens"| FE

    U -->|"Click 'Login with LinkedIn'"| FE
    FE --> CUP
    CUP -->|"Redirect to LinkedIn"| LINKEDIN
    LINKEDIN -->|"Authorization code"| CUP
    CUP --> L_POST
```
