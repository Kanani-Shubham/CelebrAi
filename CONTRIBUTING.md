# Contributing to CelebrAI

Thank you for your interest in contributing to CelebrAI! We welcome community contributions, bug reports, feature enhancements, and documentation improvements.

---

## 🛠️ Development Setup

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/Kanani-Shubham/CelebrAi.git
   cd CelebrAi
   ```

2. **Install Node.js Dependencies**:
   Ensure you are using Node.js v18 or higher:
   ```bash
   npm install
   ```

3. **Verify the Environment**:
   Run the full test suite and linter to confirm clean baseline status:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
   For full-stack execution with the local Express AI proxy:
   ```bash
   npm run dev:all
   ```

---

## 📋 Contribution Guidelines

### 1. Code Standards
- **TypeScript Strictness**: Maintain full type safety. Avoid fallback `any` types; define or extend shared interfaces in `src/types/index.ts`.
- **Linter Compliance**: Run `npm run lint` before committing. Ensure zero errors are introduced.
- **Component Architecture**: Follow atomic and modular principles. Keep business logic and state calculations decoupled inside custom hooks or utility engines (`src/utils/`).

### 2. Testing Policy
- Every new feature, calculation utility, or security sanitizer must be accompanied by corresponding Vitest unit or integration tests in `src/__tests__/`.
- Ensure all tests pass (`npm test`) before submitting a pull request.

### 3. Credential & Security Safety
- **NEVER** commit `.env`, `.env.example`, or real API credentials (Firebase, Groq).
- Maintain server-side isolation for AI and sensitive external integrations.
- Validate user inputs using `src/utils/security.ts`.

### 4. Pull Request Workflow
1. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. Commit your changes with descriptive, conventional commit messages: `feat: add dietary filter to guest list`.
3. Push to your fork: `git push origin feature/your-feature-name`.
4. Open a Pull Request against the `main` branch with a clear summary of changes, test evidence, and visual previews where applicable.

---

## 🔒 Reporting Security Vulnerabilities

Please do not report security vulnerabilities via public GitHub issues. Instead, consult [Docs/SECURITY.md](Docs/SECURITY.md) for direct, private disclosure instructions.

