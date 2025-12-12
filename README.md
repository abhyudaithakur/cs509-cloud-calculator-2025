# Cloud Calculator – CS509 / Design of Software Systems

This repository contains a cloud-based calculator with a Next.js frontend and an AWS CDK backend.  

- **Frontend**: `next-calc-2025` (Next.js, TypeScript, Axios)
- **Backend**: `cdk-calc-example-2025` (AWS CDK, Lambda, API Gateway, RDS MySQL)

The calculator supports basic arithmetic, memory operations, and named constants stored in a MySQL database.

---

## Features

### 1. Arithmetic operations

The UI is built around an **Accumulator** and an **Operand**:

- `Accumulator` – current value.
- `Operand` – value to combine with the accumulator.

Buttons:

- **ADD** – sends `arg1 = accumulator`, `arg2 = operand` to `/calc/add`.
- **MULTIPLY** – sends `arg1`, `arg2` to `/calc/mult`.
- **DIVIDE** – sends `arg1`, `arg2` to `/calc/divide`.
- **SUBTRACT** – sends `arg1`, `arg2` to `/calc/subtract`.

The backend:

- Accepts numbers or constant names.
- Uses MySQL to resolve named constants (e.g., `"pi"` → `3.14`).
- Returns the result as JSON.  
- The **Result** field in the UI shows the latest value.

### 2. Memory (M+, M-, MR, MC)

The UI includes a simple memory register:

- **MC** – clear memory (set M to 0).
- **MR** – recall memory into the accumulator and result fields.
- **M+** – add the current accumulator value to M.
- **M-** – subtract the current accumulator value from M.

This is implemented as frontend state, mirroring classic calculator behaviour.

### 3. Constants (Create / Delete)

Backed by a MySQL table `Constants(name, value)`.

- **Create constant**:
  - Enter a name (e.g., `"pi"`) and a numeric value (e.g., `3.14`).
  - Click **CREATE**.
  - Frontend calls `/calc/create-constant` (POST).
  - On success, the constants list is reloaded.

- **List constants**:
  - On page load, the frontend calls `/calc/list-constants` (GET).
  - A list of `name = value` pairs is rendered.
  - Each constant has a small trash icon.

- **Delete constant**:
  - Click the trash icon next to a constant.
  - Frontend calls `/calc/delete-constant` (POST with `{ name }`).
  - Constants list is refreshed.

Constants can also be used as operands in arithmetic calls:
- Example: set accumulator to `10` and operand to `"pi"`, then click **DIVIDE**.

---

## Repository Structure

```text
.
├── cdk-calc-example-2025/   # AWS CDK application
│   ├── bin/
│   ├── lib/
│   │   ├── application-stack.ts       # CDK stack definition
│   │   ├── add/                       # /calc/add Lambda (add.mjs, package.json, node_modules)
│   │   ├── mult/                      # /calc/mult Lambda
│   │   ├── subtract/                  # /calc/subtract Lambda
│   │   ├── divide/                    # /calc/divide Lambda
│   │   ├── create-constant/           # /calc/create-constant Lambda
│   │   ├── list-constants/            # /calc/list-constants Lambda
│   │   └── delete-constant/           # /calc/delete-constant Lambda
│   └── ...
└── next-calc-2025/           # Next.js frontend
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Main calculator UI
    │   │   ├── layout.tsx
    │   │   └── globals.css
    │   └── model.ts          # Constant model type
    └── ...
