/**
 * Sandboxed code execution via local subprocess.
 * Uses the nix-store Python and system Node.js binaries directly.
 */

import { spawn } from "child_process";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// Language → binary + file extension
const RUNTIMES: Record<string, { bin: string; ext: string }> = {
  python: {
    bin: "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3",
    ext: "py",
  },
  javascript: {
    bin: process.execPath, // same Node.js running this server
    ext: "js",
  },
};

const UNSAFE_PATTERNS = [
  /\b(import|from)\s+(os|sys|subprocess|socket| pathlib|shutil|requests|urllib)\b/i,
  /\b(__import__|eval|exec|compile|open)\s*\(/i,
  /\bprocess\s*\.\s*(env|exit|kill)/i,
  /\brequire\s*\(\s*['"`](fs|child_process|net|http)/i,
  /\b(fetch|XMLHttpRequest)\s*\(/i,
];

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  description: string;
  error?: string;
}

interface RunResult {
  success: boolean;
  testResults: TestResult[];
  testsPassed: number;
  totalTests: number;
  stdout: string;
  stderr: string;
  error?: string;
}

function execCode(
  bin: string,
  filePath: string,
  stdin: string,
  timeoutMs = 5000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(bin, [filePath], {
      timeout: timeoutMs,
      env: {
        ...process.env,
        // Restrict network / FS side-effects where possible
        PYTHONDONTWRITEBYTECODE: "1",
        PYTHONUNBUFFERED: "1",
      },
    });

    if (stdin) child.stdin.end(stdin);
    else child.stdin.end();

    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    child.on("close", (code) => {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? 1 });
    });

    child.on("error", (err) => {
      resolve({ stdout: "", stderr: err.message, exitCode: 1 });
    });
  });
}

async function runOnce(
  code: string,
  language: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; error?: string }> {
  const runtime = RUNTIMES[language];
  if (!runtime) {
    return { stdout: "", stderr: "", error: `Language "${language}" not supported yet.` };
  }

  if (code.length > 10000) {
    return { stdout: "", stderr: "", error: "Código excede o limite de 10.000 caracteres." };
  }

  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(code))) {
    return {
      stdout: "",
      stderr: "",
      error: "Código bloqueado: imports, acesso a arquivos, rede e execução dinâmica não são permitidos.",
    };
  }

  // Write code to a temp file
  const dir = await mkdtemp(join(tmpdir(), "genesis-"));
  const filePath = join(dir, `solution.${runtime.ext}`);
  try {
    await writeFile(filePath, code, "utf8");
    const result = await execCode(runtime.bin, filePath, stdin);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.exitCode !== 0 ? result.stderr || "Runtime error" : undefined,
    };
  } finally {
    unlink(filePath).catch(() => {});
  }
}

export async function runCodeAgainstTests(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<RunResult> {
  if (!testCases || testCases.length === 0) {
    const result = await runOnce(code, language, "");
    const success = !result.error && result.stdout.length > 0;
    return {
      success,
      testResults: [],
      testsPassed: success ? 1 : 0,
      totalTests: 1,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
    };
  }

  const testResults: TestResult[] = [];

  for (const tc of testCases) {
    const result = await runOnce(code, language, tc.input);

    const actual = result.stdout.trim().replace(/\r\n/g, "\n");
    const expected = tc.expectedOutput.trim().replace(/\r\n/g, "\n");

    // Flexible match: exact or the expected is contained within actual output
    const passed = !result.error && (actual === expected || actual.startsWith(expected));

    testResults.push({
      passed,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: result.stdout,
      description: tc.description,
      error: result.error,
    });
  }

  const testsPassed = testResults.filter((r) => r.passed).length;
  const firstFail = testResults.find((r) => !r.passed);

  return {
    success: testsPassed === testResults.length,
    testResults,
    testsPassed,
    totalTests: testResults.length,
    stdout: firstFail?.actualOutput ?? testResults[testResults.length - 1]?.actualOutput ?? "",
    stderr: firstFail?.error ?? "",
  };
}
