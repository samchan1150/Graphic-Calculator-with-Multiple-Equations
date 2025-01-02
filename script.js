// Import internal organization modules if applicable
// Example: import math from 'internal-math-library'; // Adjust based on actual module paths

// Global variables for zoom and pan
let xMin = -10;
let xMax = 10;
let yMin = -10;
let yMax = 10;

let isPanning = false;
let startPan = { x: 0, y: 0 };

// Reference to the canvas element
const canvas = document.getElementById('graphCanvas');

// Array to hold compiled equations
let equations = [];

// Colors for different equations
const colors = ['blue', 'red', 'green', 'orange', 'purple', 'brown', 'cyan'];
let colorIndex = 0;

// Add event listener for adding new equations
document.getElementById('addEquationButton').addEventListener('click', addEquationInput);

// Initialize the cursor style
canvas.style.cursor = 'grab';

function addEquationInput() {
    const equationsContainer = document.getElementById('equationsContainer');
    const equationEntry = document.createElement('div');
    equationEntry.className = 'equationEntry';
    equationEntry.style.marginTop = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'equationInput';
    input.placeholder = 'Enter equation in terms of x (e.g., sin(x))';

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.marginLeft = '5px';
    removeButton.onclick = function() {
        equationsContainer.removeChild(equationEntry);
    };

    equationEntry.appendChild(input);
    equationEntry.appendChild(removeButton);
    equationsContainer.appendChild(equationEntry);
}

function drawGraph() {
    // Get all user-entered equations
    const equationInputs = document.getElementsByClassName('equationInput');
    equations = [];
    colorIndex = 0; // Reset color index for consistent coloring

    // Compile each equation
    for (let input of equationInputs) {
        const equationInput = input.value.trim();
        if (equationInput === '') continue; // Skip empty inputs

        try {
            const compiled = math.compile(equationInput);
            const color = colors[colorIndex % colors.length];
            equations.push({ compiled, color });
            colorIndex++;
        } catch (error) {
            alert('Invalid equation: "' + equationInput + '". Please check your input.');
            return;
        }
    }

    if (equations.length === 0) {
        alert('Please enter at least one valid equation.');
        return;
    }

    // Get the canvas context
    const ctx = canvas.getContext('2d');

    // Clear the previous graph
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factors
    const scaleX = canvas.width / (xMax - xMin);
    const scaleY = canvas.height / (yMax - yMin);

    // Increase the number of samples
    const steps = canvas.width * 10; // You can adjust the multiplier
    const dx = (xMax - xMin) / steps;

    // Draw gridlines and axes
    drawGridlines(ctx, scaleX, scaleY);
    drawAxes(ctx, scaleX, scaleY);

    // Plot each equation
    equations.forEach(equationObj => {
        ctx.beginPath();
        ctx.strokeStyle = equationObj.color;
        ctx.lineWidth = 2;

        let firstPoint = true;
        for (let i = 0; i <= steps; i++) {
            const x = xMin + i * dx;
            let y;
            try {
                y = equationObj.compiled.evaluate({ x: x });
            } catch (error) {
                firstPoint = true;
                continue;
            }

            if (!isFinite(y)) {
                firstPoint = true;
                continue;
            }

            const pixelX = (x - xMin) * scaleX;
            const pixelY = canvas.height - ((y - yMin) * scaleY);

            if (pixelY < 0 || pixelY > canvas.height) {
                firstPoint = true;
                continue;
            }

            if (firstPoint) {
                ctx.moveTo(pixelX, pixelY);
                firstPoint = false;
            } else {
                ctx.lineTo(pixelX, pixelY);
            }
        }
        ctx.stroke();
    });
}

function drawGridlines(ctx, scaleX, scaleY) {
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Determine grid spacing
    const xGridSpacing = calculateGridSpacing(xMin, xMax);
    const yGridSpacing = calculateGridSpacing(yMin, yMax);

    // Vertical gridlines
    for (let x = Math.ceil(xMin / xGridSpacing) * xGridSpacing; x <= xMax; x += xGridSpacing) {
        const pixelX = (x - xMin) * scaleX;
        ctx.moveTo(pixelX, 0);
        ctx.lineTo(pixelX, canvas.height);
    }

    // Horizontal gridlines
    for (let y = Math.ceil(yMin / yGridSpacing) * yGridSpacing; y <= yMax; y += yGridSpacing) {
        const pixelY = canvas.height - (y - yMin) * scaleY;
        ctx.moveTo(0, pixelY);
        ctx.lineTo(canvas.width, pixelY);
    }

    ctx.stroke();
}

function drawAxes(ctx, scaleX, scaleY) {
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // X-axis
    const yZero = canvas.height - (-yMin) * scaleY;
    ctx.moveTo(0, yZero);
    ctx.lineTo(canvas.width, yZero);

    // Y-axis
    const xZero = (-xMin) * scaleX;
    ctx.moveTo(xZero, 0);
    ctx.lineTo(xZero, canvas.height);

    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';

    // X-axis labels
    const xGridSpacing = calculateGridSpacing(xMin, xMax);
    for (let x = Math.ceil(xMin / xGridSpacing) * xGridSpacing; x <= xMax; x += xGridSpacing) {
        const pixelX = (x - xMin) * scaleX;
        ctx.fillText(x.toFixed(2), pixelX + 2, yZero - 2);
    }

    // Y-axis labels
    const yGridSpacing = calculateGridSpacing(yMin, yMax);
    for (let y = Math.ceil(yMin / yGridSpacing) * yGridSpacing; y <= yMax; y += yGridSpacing) {
        const pixelY = canvas.height - (y - yMin) * scaleY;
        ctx.fillText(y.toFixed(2), xZero + 2, pixelY - 2);
    }
}

function calculateGridSpacing(min, max) {
    const range = Math.abs(max - min);
    const roughSpacing = range / 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughSpacing)));
    const residual = roughSpacing / magnitude;

    if (residual >= 5) return 5 * magnitude;
    if (residual >= 2) return 2 * magnitude;
    return magnitude;
}

function calculateYValue() {
    // Get the user-entered x value
    const xInput = document.getElementById('xValue').value;
    const x = parseFloat(xInput);

    // Check if x is a valid number
    if (isNaN(x)) {
        alert('Please enter a valid number for x.');
        return;
    }

    // Check if there are equations defined
    if (equations.length === 0) {
        alert('Please enter at least one equation and plot the graph first.');
        return;
    }

    // Prepare to display y-values for all equations
    const yDisplay = document.getElementById('yValueDisplay');
    yDisplay.innerHTML = ''; // Clear previous results

    equations.forEach((equationObj, index) => {
        let y;
        try {
            y = equationObj.compiled.evaluate({ x: x });
        } catch (error) {
            yDisplay.innerHTML += `Equation ${index + 1}: Error evaluating at x = ${x}<br>`;
            return;
        }

        if (!isFinite(y) || isNaN(y)) {
            yDisplay.innerHTML += `Equation ${index + 1}: Undefined at x = ${x}<br>`;
            return;
        }

        yDisplay.innerHTML += `Equation ${index + 1}: When x = ${x.toFixed(2)}, y = ${y.toFixed(2)}<br>`;
    });

    // Optionally, adjust the graph view based on the last evaluated y
    const lastY = equations[equations.length - 1].compiled.evaluate({ x: x });
    if (isFinite(lastY)) {
        const rangeX = xMax - xMin;
        const rangeY = yMax - yMin;

        xMin = x - rangeX / 2;
        xMax = x + rangeX / 2;
        yMin = lastY - rangeY / 2;
        yMax = lastY + rangeY / 2;

        // Redraw the graph
        drawGraph();
    }
}

function showCoordinates(event) {
    // Get mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    // Convert pixel coordinates to mathematical coordinates
    const xMouse = xMin + (pixelX / canvas.width) * (xMax - xMin);
    const yMouse = yMax - (pixelY / canvas.height) * (yMax - yMin);

    // Define a range around the mouse position to search for the closest point on the graphs
    const xRange = (xMax - xMin) * 0.005; // Adjust the multiplier for a wider or narrower search range
    const numSamples = 100; // Number of points to sample within the range

    let closestDistance = Infinity;
    let closestPoint = null;
    let closestEquation = null;

    // Iterate through each equation to find the closest point
    equations.forEach(equationObj => {
        for (let i = 0; i <= numSamples; i++) {
            // Calculate the x-value for this sample
            const x = xMouse - xRange / 2 + (i / numSamples) * xRange;

            // Evaluate the equation at x to get y
            let yOnGraph;
            try {
                yOnGraph = equationObj.compiled.evaluate({ x: x });
            } catch (error) {
                continue; // Skip if the equation cannot be evaluated at this x
            }

            if (!isFinite(yOnGraph)) continue;

            // Convert the point to pixel coordinates
            const pixelXGraph = ((x - xMin) / (xMax - xMin)) * canvas.width;
            const pixelYGraph = canvas.height - ((yOnGraph - yMin) / (yMax - yMin)) * canvas.height;

            // Calculate the distance between the mouse position and this point on the graph
            const dx = pixelX - pixelXGraph;
            const dy = pixelY - pixelYGraph;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Update the closest point if this one is closer
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = {
                    x: x,
                    y: yOnGraph,
                    pixelX: pixelXGraph,
                    pixelY: pixelYGraph
                };
                closestEquation = equationObj;
            }
        }
    });

    // Define a threshold in pixels for how close the mouse must be to the graph to display the coordinates
    const threshold = 10; // You can adjust this value

    // Get the canvas context
    const ctx = canvas.getContext('2d');

    // Clear and redraw the graph
    drawGraph();

    if (closestDistance < threshold && closestPoint && closestEquation) {
        // Draw a small circle at the closest point on the graph
        ctx.beginPath();
        ctx.arc(closestPoint.pixelX, closestPoint.pixelY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();

        // Display the coordinates near the point
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        const coordText = `(${closestPoint.x.toFixed(2)}, ${closestPoint.y.toFixed(2)})`;
        ctx.fillText(coordText, closestPoint.pixelX + 10, closestPoint.pixelY - 10);
    }
}

// Zooming
canvas.addEventListener('wheel', function (event) {
    event.preventDefault();

    const zoomFactor = 1.1;
    const { offsetX, offsetY, deltaY } = event;

    // Get mouse position in terms of coordinate system
    const mouseX = xMin + (offsetX / canvas.width) * (xMax - xMin);
    const mouseY = yMin + ((canvas.height - offsetY) / canvas.height) * (yMax - yMin);

    if (deltaY < 0) {
        // Zoom in
        xMin = mouseX + (xMin - mouseX) / zoomFactor;
        xMax = mouseX + (xMax - mouseX) / zoomFactor;
        yMin = mouseY + (yMin - mouseY) / zoomFactor;
        yMax = mouseY + (yMax - mouseY) / zoomFactor;
    } else {
        // Zoom out
        xMin = mouseX + (xMin - mouseX) * zoomFactor;
        xMax = mouseX + (xMax - mouseX) * zoomFactor;
        yMin = mouseY + (yMin - mouseY) * zoomFactor;
        yMax = mouseY + (yMax - mouseY) * zoomFactor;
    }
    drawGraph();
});

// Panning
canvas.addEventListener('mousedown', function (event) {
    isPanning = true;
    startPan = { x: event.clientX, y: event.clientY };
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', function (event) {
    if (isPanning) {
        const dx = event.clientX - startPan.x;
        const dy = event.clientY - startPan.y;
        const scaleX = (xMax - xMin) / canvas.width;
        const scaleY = (yMax - yMin) / canvas.height;

        xMin -= dx * scaleX;
        xMax -= dx * scaleX;
        yMin += dy * scaleY;
        yMax += dy * scaleY;

        startPan = { x: event.clientX, y: event.clientY };
        drawGraph();
    }
});

canvas.addEventListener('mouseup', function () {
    isPanning = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', function () {
    isPanning = false;
    canvas.style.cursor = 'grab';
});

// Attach the showCoordinates function to mousemove
canvas.addEventListener('mousemove', showCoordinates);