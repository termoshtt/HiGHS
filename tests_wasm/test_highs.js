const path = require('node:path');
const { glob } = require('glob');
const { loadPyodide } = require("pyodide");

async function test_highs() {
    const wheels = await glob('../wheelhouse/highspy-*-cp313-*.whl', { cwd: __dirname });
    if (wheels.length === 0) {
        throw new Error('No wheel found for highspy');
    }
    const wheelPath = path.resolve(__dirname, wheels[0]);
    console.log('Loading wheel:', wheelPath);

    let pyodide = await loadPyodide();
    await pyodide.loadPackage(['numpy']);
    await pyodide.loadPackage(wheelPath);

    return pyodide.runPythonAsync(`
import highspy

h = highspy.Highs()
h.silent()

# Simple LP: minimize x + y subject to x + y >= 1, x >= 0, y >= 0
h.addVar(0, float('inf'))  # x >= 0
h.addVar(0, float('inf'))  # y >= 0
h.changeColCost(0, 1)
h.changeColCost(1, 1)
h.addRow(1, float('inf'), 2, [0, 1], [1, 1])  # x + y >= 1

h.run()
solution = h.getSolution()
print(f"Optimal x = {solution.col_value[0]}, y = {solution.col_value[1]}")
print(f"Objective = {h.getInfo().objective_function_value}")
print("HiGHS WASM test passed!")
    `);
}

test_highs().catch(e => {
    console.error(e);
    process.exit(1);
});
