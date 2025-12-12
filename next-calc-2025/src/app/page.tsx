"use client";

import React from "react";
import axios from "axios";
import { Constant } from "../model";

// All traffic for the calculator API
const instance = axios.create({
    baseURL:
        "https://yjtgxhok86.execute-api.us-east-2.amazonaws.com/prod/calc/",
});

// ---------- Helpers ----------

function getInput(id: string): HTMLInputElement | null {
    return document.getElementById(id) as HTMLInputElement | null;
}

function getAccumulatorValue(): number {
    const acc = getInput("accumulator");
    if (!acc) return 0;
    const v = parseFloat(acc.value);
    return Number.isNaN(v) ? 0 : v;
}

// ---------- Constants List component ----------

type ConstantListProps = {
    constants: Constant[] | undefined;
    deleteConstant: (name: string) => void;
};

function ConstantList({ constants, deleteConstant }: ConstantListProps) {
    if (!constants) return <div>Loading...</div>;
    if (constants.length === 0) return <div>No constants defined yet.</div>;

    return (
        <ul>
            {constants.map((constant) => (
                <li
                    key={constant.name}
                    className="flex items-center gap-2 my-1"
                >
                    <button
                        className="button"
                        style={{ padding: "0.1rem 0.6rem", fontSize: "0.8rem" }}
                        onClick={() => deleteConstant(constant.name)}
                    >
                        DELETE
                    </button>
                    <span>
                        <b>{constant.name}</b> = {constant.value}
                    </span>
                </li>
            ))}
        </ul>
    );
}

// Load constants from API
function retrieveConstants(
    setConstants: (value: Constant[] | undefined) => void
) {
    instance
        .get("list-constants")
        .then((response) => {
            const status = response.data.statusCode;
            if (status === 200) {
                const ret: Constant[] = [];
                const vals = JSON.parse(response.data.body);
                if (vals.constants && Array.isArray(vals.constants)) {
                    for (const con of vals.constants) {
                        ret.push(new Constant(con.name, con.value));
                    }
                }
                setConstants(ret);
            } else {
                console.error("list-constants non-200", response.data);
                setConstants([]);
            }
        })
        .catch((error) => {
            console.error("Error loading constants", error);
            setConstants([]);
        });
}

// Call an arithmetic operation on the backend
type Operation = "add" | "mult" | "divide" | "subtract";

function callBinaryOperation(op: Operation) {
    const acc = getInput("accumulator");
    const opnd = getInput("operand");
    const res = getInput("result");

    if (!acc || !opnd || !res) return;

    instance
        .post(op, { arg1: acc.value, arg2: opnd.value })
        .then((response) => {
            const status = response.data.statusCode;
            const body = response.data.body;

            if (status === 200) {
                // body may be "6" or 6
                let value: string;
                if (typeof body === "string") {
                    try {
                        value = String(JSON.parse(body));
                    } catch {
                        value = body;
                    }
                } else {
                    value = String(body);
                }

                // Homework spec: Accumulator holds the result
                acc.value = value;
                res.value = value;
            } else {
                res.value = "error: " + String(body);
            }
        })
        .catch((error) => {
            res.value = String(error);
        });
}

// ---------- Top-level component ----------

export default function Home() {
    const [constants, setConstants] = React.useState<Constant[] | undefined>(
        undefined
    );

    // Memory register (front-end only)
    const [memory, setMemory] = React.useState<number>(0);

    React.useEffect(() => {
        if (constants === undefined) {
            retrieveConstants(setConstants);
        }
    }, [constants]);

    // ---- arithmetic button handlers ----
    function handleAdd() {
        callBinaryOperation("add");
    }

    function handleMultiply() {
        callBinaryOperation("mult");
    }

    function handleDivide() {
        callBinaryOperation("divide");
    }

    function handleSubtract() {
        callBinaryOperation("subtract");
    }

    // ---- Memory buttons ----
    function handleMC() {
        setMemory(0);
    }

    function handleMR() {
        const acc = getInput("accumulator");
        const res = getInput("result");
        if (acc) acc.value = memory.toString();
        if (res) res.value = memory.toString();
    }

    function handleMPlus() {
        const accVal = getAccumulatorValue();
        // classic calculator semantics: M = M + accumulator
        setMemory((prev) => prev + accVal);
    }

    function handleMMinus() {
        const accVal = getAccumulatorValue();
        // M = M - accumulator
        setMemory((prev) => prev - accVal);
    }

    // ---- Constants ----
    function createConstant() {
        const nameInput = getInput("constant-name");
        const valueInput = getInput("constant-value");
        const res = getInput("result");

        if (!nameInput || !valueInput) return;

        instance
            .post("create-constant", {
                name: nameInput.value,
                value: valueInput.value,
            })
            .then((response) => {
                const status = response.data.statusCode;
                if (status === 200) {
                    nameInput.value = "";
                    valueInput.value = "";
                    // force reload
                    setConstants(undefined);
                } else if (res) {
                    res.value = "error: " + String(response.data.body);
                }
            })
            .catch((error) => {
                console.error("Error creating constant", error);
                if (res) res.value = String(error);
            });
    }

    function deleteConstant(name: string) {
        const res = getInput("result");

        instance
            .post("delete-constant", { name })
            .then((response) => {
                const status = response.data.statusCode;
                if (status === 200) {
                    setConstants(undefined); // reload
                } else if (res) {
                    res.value = "error: " + String(response.data.body);
                }
            })
            .catch((error) => {
                console.error("Error deleting constant", error);
                if (res) res.value = String(error);
            });
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
            <div className="w-full max-w-4xl">
                {/* Calculator */}
                <h1 className="text-2xl font-bold mb-4">Cloud Calculator</h1>

                <label>Accumulator:</label>
                <input
                    id="accumulator"
                    className="text"
                    defaultValue="0"
                    style={{ width: "100%" }}
                />

                <br />
                <br />

                <label>Operand:</label>
                <input
                    id="operand"
                    className="text"
                    style={{ width: "100%" }}
                />

                <br />
                <br />

                <div className="flex gap-2 mb-2">
                    <button className="button" onClick={handleAdd}>
                        ADD
                    </button>
                    <button className="button" onClick={handleMultiply}>
                        MULTIPLY
                    </button>
                    <button className="button" onClick={handleDivide}>
                        DIVIDE
                    </button>
                    <button className="button" onClick={handleSubtract}>
                        SUBTRACT
                    </button>
                </div>

                <label>Result:</label>
                <input
                    id="result"
                    className="text"
                    readOnly
                    style={{ width: "100%" }}
                />

                <br />
                <br />

                {/* Memory */}
                <h2 className="text-xl font-bold mb-2">Memory</h2>
                <p>
                    M = <b>{memory}</b>
                </p>
                <div className="flex gap-2 mb-6 mt-2">
                    <button className="button" onClick={handleMC}>
                        MC
                    </button>
                    <button className="button" onClick={handleMR}>
                        MR
                    </button>
                    <button className="button" onClick={handleMPlus}>
                        M+
                    </button>
                    <button className="button" onClick={handleMMinus}>
                        M-
                    </button>
                </div>

                {/* Constants */}
                <h2 className="text-xl font-bold mb-2">Adjust Constants</h2>

                <label>name:</label>
                <input
                    id="constant-name"
                    className="text"
                    style={{ width: "100%" }}
                />

                <br />
                <br />

                <label>value:</label>
                <input
                    id="constant-value"
                    className="text"
                    style={{ width: "100%" }}
                />

                <br />
                <br />

                <button className="button mb-4" onClick={createConstant}>
                    CREATE
                </button>

                <h3 className="text-lg font-semibold mt-4 mb-2">
                    <u>Constants List</u>
                </h3>

                <ConstantList
                    constants={constants}
                    deleteConstant={deleteConstant}
                />
            </div>
        </main>
    );
}
