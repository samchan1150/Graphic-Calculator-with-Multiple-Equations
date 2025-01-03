// script.js

// Assuming math.js is loaded via script tag in index.html
const math = window.math;

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
const colors = ['#1E90FF', '#FF4500', '#32CD32', '#FFD700', '#FF69B4', '#8A2BE2', '#00CED1'];
let colorIndex = 0;

// Add event listener for adding new equations
document.getElementById('addEquationButton').addEventListener('click', addEquationInput);

// Initialize the cursor style
canvas.style.cursor = 'grab';

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function}
 */
function debounce(func, delay) {
    let debounceTimer;
    return function(...args) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

/**
 * Adds a new equation input entry to the UI
 */
function addEquationInput() {
    const equationsContainer = document.getElementById('equationsContainer');
    const equationEntry = document.createElement('div');
    equationEntry.className = 'equationEntry';
    equationEntry.style.marginTop = '10px';

    // Equation Input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'equationInput';
    input.placeholder = 'Enter equation in terms of x';
    input.dataset.visible = 'true'; // Set default visibility

    // Toggle Visibility Button
    const toggleVisibilityButton = document.createElement('button');
    toggleVisibilityButton.className = 'toggleVisibilityButton';
    toggleVisibilityButton.title = 'Toggle Visibility';
    const eyeIcon = document.createElement('span');
    eyeIcon.className = 'material-icons';
    eyeIcon.textContent = 'visibility';
    toggleVisibilityButton.appendChild(eyeIcon);

    // Remove Button
    const removeButton = document.createElement('button');
    removeButton.className = 'removeButton';
    removeButton.title = 'Remove Equation';
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'material-icons';
    deleteIcon.textContent = 'delete';
    removeButton.appendChild(deleteIcon);

    // Inline Error Message
    const errorMessage = document.createElement('span');
    errorMessage.className = 'error-message';

    // Event listener to remove the equation entry
    removeButton.addEventListener('click', function () {
        equationsContainer.removeChild(equationEntry);
        drawGraph();
    });

    // Event listener to toggle visibility
    toggleVisibilityButton.addEventListener('click', function () {
        input.dataset.visible = input.dataset.visible === 'false' ? 'true' : 'false';
        toggleVisibilityButton.classList.toggle('hidden', input.dataset.visible === 'false');
        // Change icon based on visibility
        eyeIcon.textContent = input.dataset.visible === 'false' ? 'visibility_off' : 'visibility';
        drawGraph();
    });

    // Event listener for input changes to auto-update the graph on blur
    input.addEventListener('blur', function () {
        validateAndDrawGraph(input.value, equationEntry);
    });

    // Append elements to equationEntry
    equationEntry.appendChild(input);
    equationEntry.appendChild(toggleVisibilityButton);
    equationEntry.appendChild(removeButton);
    equationEntry.appendChild(errorMessage);

    // Append equationEntry to equationsContainer
    equationsContainer.appendChild(equationEntry);
}

/**
 * Initializes existing equation entries on page load
 */
function initializeEquationEntries() {
    const equationEntries = document.getElementsByClassName('equationEntry');

    for (let entry of equationEntries) {
        const input = entry.getElementsByClassName('equationInput')[0];
        const toggleVisibilityButton = entry.getElementsByClassName('toggleVisibilityButton')[0];
        const removeButton = entry.getElementsByClassName('removeButton')[0];
        const errorMessage = entry.getElementsByClassName('error-message')[0];
        const eyeIcon = toggleVisibilityButton.querySelector('.material-icons');

        // Ensure data-visible is set
        if (!input.dataset.visible) {
            input.dataset.visible = 'true';
        }

        // Event listener to toggle visibility
        toggleVisibilityButton.addEventListener('click', function () {
            input.dataset.visible = input.dataset.visible === 'false' ? 'true' : 'false';
            toggleVisibilityButton.classList.toggle('hidden', input.dataset.visible === 'false');
            // Change icon based on visibility
            eyeIcon.textContent = input.dataset.visible === 'false' ? 'visibility_off' : 'visibility';
            drawGraph();
        });

        // Event listener to remove the equation entry
        removeButton.addEventListener('click', function () {
            entry.parentNode.removeChild(entry);
            drawGraph();
        });

        // Event listener for input changes to auto-update the graph on blur
        input.addEventListener('blur', function () {
            validateAndDrawGraph(input.value, entry);
        });
    }
}

/**
 * Validates the equation and redraws the graph if valid
 * Displays inline error messages as overlays if invalid
 * @param {string} equationInput - The equation input by the user
 * @param {HTMLElement} equationEntry - The parent div of the equation input
 */
function validateAndDrawGraph(equationInput, equationEntry) {
    const errorMessage = equationEntry.getElementsByClassName('error-message')[0];

    if (equationInput.trim() === '') {
        // If the input is empty, clear any previous error and redraw the graph
        errorMessage.textContent = '';
        equationEntry.classList.remove('error');
        drawGraph();
        return;
    }

    try {
        // Attempt to compile the equation
        math.compile(equationInput);
        // If successful, clear error and redraw the graph
        errorMessage.textContent = '';
        equationEntry.classList.remove('error');
        drawGraph();
    } catch (error) {
        // If there's a compilation error, display error message inline overlay above the input
        errorMessage.textContent = `Invalid equation: "${equationInput}". Please check your input.`;

        // Add 'error' class to equationEntry for styling (shows the overlay)
        equationEntry.classList.add('error');

        // Remove the error highlight when the user focuses back on the input
        const input = equationEntry.getElementsByClassName('equationInput')[0];
        input.addEventListener('focus', function removeErrorHighlight() {
            equationEntry.classList.remove('error');
            errorMessage.textContent = '';
            input.removeEventListener('focus', removeErrorHighlight);
        });
    }
}

/**
 * Draws the graph based on the current equations and visibility states
 */
function drawGraph() {
    // Get all user-entered equations
    const equationEntries = document.getElementsByClassName('equationEntry');
    equations = [];
    colorIndex = 0; // Reset color index for consistent coloring

    // Compile each equation
    for (let entry of equationEntries) {
        const input = entry.getElementsByClassName('equationInput')[0];
        const equationInput = input.value.trim();
        const isVisible = input.dataset.visible !== 'false'; // Default to visible

        if (equationInput === '') continue; // Skip empty inputs

        try {
            const compiled = math.compile(equationInput);
            const color = colors[colorIndex % colors.length];
            equations.push({ compiled, color, visible: isVisible });
            colorIndex++;
        } catch (error) {
            // Skip rendering invalid equations
            continue;
        }
    }

    // Get the canvas context
    const ctx = canvas.getContext('2d');

    // Clear the previous graph
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factors
    const scaleX = canvas.width / (xMax - xMin);
    const scaleY = canvas.height / (yMax - yMin);

    // Draw gridlines and axes
    drawGridlines(ctx, scaleX, scaleY);
    drawAxes(ctx, scaleX, scaleY);

    // Plot each visible equation
    equations.forEach(equationObj => {
        if (!equationObj.visible) return; // Skip if not visible

        ctx.beginPath();
        ctx.strokeStyle = equationObj.color;
        ctx.lineWidth = 2;

        let firstPoint = true;
        const steps = canvas.width * 10; // Adjust the multiplier if needed
        const dx = (xMax - xMin) / steps;

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

/**
 * Draws gridlines on the canvas
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} scaleX - The scale factor for the X-axis
 * @param {number} scaleY - The scale factor for the Y-axis
 */
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

/**
 * Draws the X and Y axes on the canvas with labels
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} scaleX - The scale factor for the X-axis
 * @param {number} scaleY - The scale factor for the Y-axis
 */
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

/**
 * Calculates appropriate grid spacing based on the current range
 * @param {number} min - The minimum value of the axis
 * @param {number} max - The maximum value of the axis
 * @returns {number} - The grid spacing
 */
function calculateGridSpacing(min, max) {
    const range = Math.abs(max - min);
    const roughSpacing = range / 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughSpacing)));
    const residual = roughSpacing / magnitude;

    if (residual >= 5) return 5 * magnitude;
    if (residual >= 2) return 2 * magnitude;
    return magnitude;
}

/**
 * Calculates Y values based on user input for a specific X value
 */
function calculateYValue() {
    // Get the user-entered x value
    const xInput = document.getElementById('xValue').value;
    const x = parseFloat(xInput);

    // Check if x is a valid number
    if (isNaN(x)) {
        displayYValueError('Please enter a valid number for x.');
        return;
    }

    // Prepare to display y-values for all equations
    const yDisplay = document.getElementById('yValueDisplay');
    yDisplay.innerHTML = ''; // Clear previous results

    equations.forEach((equationObj, index) => {
        if (!equationObj.visible) return; // Skip if not visible

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
}

/**
 * Displays error messages within the UI for Y value calculations
 * @param {string} message - The error message to display
 */
function displayYValueError(message) {
    const yDisplay = document.getElementById('yValueDisplay');
    yDisplay.innerHTML = `<span class="error-message">${message}</span>`;
}

/**
 * Shows coordinates when mouse is near the graph
 * @param {MouseEvent} event - The mouse event
 */
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
        if (!equationObj.visible) return; // Skip if not visible

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

/**
 * Initializes existing equation entries and draws the initial graph
 */
document.addEventListener('DOMContentLoaded', function () {
    initializeEquationEntries();
    drawGraph();

    // Initialize Tutorial Overlay Functionality
    const tutorialButton = document.getElementById('tutorialButton');
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const closeTutorial = document.querySelector('.close-tutorial');

    tutorialButton.addEventListener('click', function () {
        tutorialOverlay.classList.add('active');
    });

    closeTutorial.addEventListener('click', function () {
        tutorialOverlay.classList.remove('active');
    });

    // Optional: Close the overlay when clicking outside the tutorial content
    tutorialOverlay.addEventListener('click', function (event) {
        if (event.target === tutorialOverlay) {
            tutorialOverlay.classList.remove('active');
        }
    });
});

/**
 * Zooming Functionality
 */
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

/**
 * Panning Functionality
 */
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