// Global variables for zoom and pan
let xMin = -10;
let xMax = 10;
let yMin = -10;
let yMax = 10;

let isPanning = false;
let startPan = { x: 0, y: 0 };

// Reference to the canvas element
const canvas = document.getElementById('graphCanvas');

let equation;

function drawGraph() {
    // Get the user-entered equation
    const equationInput = document.getElementById('equation').value;

    // Compile the equation

    try {
        equation = math.compile(equationInput);
    } catch (error) {
        alert('Invalid equation. Please check your input.');
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

    // Plot the equation
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    let firstPoint = true;
    for (let pixelX = 0; pixelX <= canvas.width; pixelX+=dx) {
        // Convert pixel x-coordinate to mathematical x-coordinate
        const x = xMin + (pixelX / canvas.width) * (xMax - xMin);

        // Evaluate the equation at x
        let y;
        try {
            y = equation.evaluate({ x: x });
        } catch (error) {
            firstPoint = true;
            continue;
        }

        // Skip if y is not finite
        if (!isFinite(y)) {
            firstPoint = true;
            continue;
        }

        // Convert mathematical y-coordinate to pixel y-coordinate
        const pixelY = canvas.height - ((y - yMin) * scaleY);

        // If the point is outside the canvas, skip drawing it
        if (pixelY < 0 || pixelY > canvas.height) {
            firstPoint = true;
            continue;
        }

        // Draw the point
        if (firstPoint) {
            ctx.moveTo(pixelX, pixelY);
            firstPoint = false;
        } else {
            ctx.lineTo(pixelX, pixelY);
        }
    }
    ctx.stroke();
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
    const range = max - min;
    const roughGridSize = range / 10;
    const exponent = Math.floor(Math.log10(roughGridSize));
    const fraction = roughGridSize / Math.pow(10, exponent);
    let niceFraction;

    if (fraction <= 1) {
        niceFraction = 1;
    } else if (fraction <= 2) {
        niceFraction = 2;
    } else if (fraction <= 5) {
        niceFraction = 5;
    } else {
        niceFraction = 10;
    }

    return niceFraction * Math.pow(10, exponent);
}


function showCoordinates(event) {
    // Get mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    // Convert pixel coordinates to mathematical coordinates
    const xMouse = xMin + (pixelX / canvas.width) * (xMax - xMin);
    const yMouse = yMax - (pixelY / canvas.height) * (yMax - yMin);

    // Define a range around the mouse position to search for the closest point on the graph
    const xRange = (xMax - xMin) * 0.01; // Adjust the multiplier for a wider or narrower search range
    const numSamples = 50; // Number of points to sample within the range

    let closestDistance = Infinity;
    let closestPoint = null;

    // Sample points around the mouse position
    for (let i = 0; i <= numSamples; i++) {
        // Calculate the x-value for this sample
        const x = xMouse - xRange / 2 + (i / numSamples) * xRange;

        // Evaluate the equation at x to get y
        let yOnGraph;
        try {
            yOnGraph = equation.evaluate({ x: x });
        } catch (error) {
            continue; // Skip if the equation cannot be evaluated at this x
        }

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
        }
    }

    // Define a threshold in pixels for how close the mouse must be to the graph to display the coordinates
    const threshold = 10; // You can adjust this value

    if (closestDistance < threshold) {
        // Clear and redraw the graph
        drawGraph();

        const ctx = canvas.getContext('2d');

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
    } else {
        // Optionally, redraw the graph without the point if the mouse is not close
        drawGraph();
    }
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

    // Check if the equation has been defined
    if (!equation) {
        alert('Please enter an equation and plot the graph first.');
        return;
    }

    // Evaluate the equation at x
    let y;
    try {
        y = equation.evaluate({ x: x });
    } catch (error) {
        alert('Error evaluating the equation at x = ' + x);
        return;
    }

    // Handle undefined or infinite y-values
    if (!isFinite(y) || isNaN(y)) {
        alert('The equation is undefined at x = ' + x);
        return;
    }

    // Display the y value with two decimal places
    const yDisplay = document.getElementById('yValueDisplay');
    yDisplay.textContent = 'When x = ' + x.toFixed(2) + ', y = ' + y.toFixed(2);

    // Adjust the graph view to center on (x, y)
    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;

    xMin = x - rangeX / 2;
    xMax = x + rangeX / 2;
    yMin = y - rangeY / 2;
    yMax = y + rangeY / 2;

    // Redraw the graph
    drawGraph();
}



// Event listeners for zoom and pan

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

canvas.addEventListener('mousemove', showCoordinates);