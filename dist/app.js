"use strict";
/**
 * Class representing the organizational chart.
 */
var OrganizationChart = /** @class */ (function () {
    /**
     * Creates an instance of OrganizationChart.
     * @param canvas - The HTML element where the chart will be rendered.
     * @param data - The data for the organizational chart.
     */
    function OrganizationChart(canvas, data, generateNodeContent, generateTransitionContent) {
        this.canvas = canvas;
        this.data = data;
        this.container = document.createElement('div');
        this.container.classList.add('contents');
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isDragging = false;
        this.animationFrameId = null;
        this.minScale = 0.5;
        this.maxScale = 1;
        this.animationTiming = 400;
        this.generateNodeContent = generateNodeContent;
        this.generateTransitionContent = generateTransitionContent;
        this.init();
    }
    /**
     * Initializes the organizational chart by building the chart, attaching event listeners, and initializing drag and zoom functionality.
     */
    OrganizationChart.prototype.init = function () {
        this.buildChart();
        this.canvas.appendChild(this.container);
        this.attachEventListeners();
        this.initDragAndZoom();
        // this.centerContent();
    };
    /**
     * Creates the HTML for a node.
     * @param element - The node data.
     * @returns The HTML string for the node.
     */
    OrganizationChart.prototype.createNode = function (element) {
        var _this = this;
        var className = "node ".concat(element.node_type, "_node");
        var nodeHTML = "<div class=\"".concat(className, "\" id=\"node-").concat(element.id, "\">");
        if (element.node_type === 'transitional' && element.transition_content) {
            var transitionContentClass = element.transition_content.transition_logic && element.transition_content.transition_logic.length < 1
                ? 'transitional_content transition_error slds-card'
                : 'transitional_content slds-card';
            nodeHTML += "\n                <div class=\"".concat(transitionContentClass, "\">\n                    <div class=\"slds-card__header slds-grid\">\n                        <header class=\"slds-media slds-media_center slds-has-flexi-truncate\">\n                        <div class=\"slds-media__figure\">\n                            <span class=\"slds-icon_container slds-icon-transition\" title=\"account\">\n                                <svg class=\"slds-icon slds-icon_small\" aria-hidden=\"true\">\n                                    <use xlink:href=\"/assets/icons/standard-sprite/svg/symbols.svg#account\"></use>\n                                </svg>\n                                <span class=\"slds-assistive-text\">account</span>\n                            </span>\n                        </div>\n                        <div class=\"slds-media__body\">\n                            <h2 class=\"slds-card__header-title\">\n                                <a href=\"#\" class=\"slds-card__header-link slds-truncate\" title=\"").concat(element.transition_content.transition_name, "\">\n                                    <span>").concat(element.transition_content.transition_name, "</span>\n                                </a>\n                            </h2>\n                        </div>\n                        <div class=\"slds-no-flex\">\n                            <button class=\"slds-button slds-button_neutral\" id=\"").concat(element.id, "\">Edit</button>\n                        </div>\n                    </header>\n                    </div>\n                </div>\n            ");
            if (element.transition_content.transition_logic && element.transition_content.transition_logic.length < 1) {
                nodeHTML += "\n                <div class=\"error-container\">\n                    Transition logic has not been implemented yet.\n                </div>\n            ";
            }
            nodeHTML += "<div class=\"node_connector node_connector_transition-block\"></div>";
        }
        nodeHTML += "\n            <article class=\"node_content slds-card\">\n                <div class=\"slds-card__header slds-grid\">\n                    <header class=\"slds-media slds-media_center slds-has-flexi-truncate\">\n                        <div class=\"slds-media__figure\">\n                            <span class=\"slds-icon_container slds-icon-standard-account\" title=\"account\">\n                                <svg class=\"slds-icon slds-icon_small\" aria-hidden=\"true\">\n                                    <use xlink:href=\"/assets/icons/standard-sprite/svg/symbols.svg#account\"></use>\n                                </svg>\n                                <span class=\"slds-assistive-text\">account</span>\n                            </span>\n                        </div>\n                        <div class=\"slds-media__body\">\n                            <h2 class=\"slds-card__header-title\">\n                                <a href=\"#\" class=\"slds-card__header-link slds-truncate\" title=\"".concat(element.stage_name, "\">\n                                    <span>").concat(element.stage_name, "</span>\n                                </a>\n                            </h2>\n                        </div>\n                        <div class=\"slds-no-flex\">\n                            ").concat(element.node_type !== 'root' ? "<button class=\"slds-button slds-button_neutral node_remover\" id=\"".concat(element.id, "\">Delete</button>") : '', "\n                        </div>\n                    </header>\n                </div>\n                <div class=\"slds-card__body slds-card__body_inner\">\n                    ").concat(this.generateNodeContent(element), "\n                </div>\n            </article>\n            <div class=\"node_connector ").concat(element.childrens && element.childrens.length > 1 ? 'actionable' : '', "\">\n        ");
        if (element.node_type === 'root' && element.childrens && element.childrens.length === 0) {
            nodeHTML += "\n                        <div class=\"node_connector_action\">\n                            <button id=\"".concat(element.id, "\" class=\"node_adder\"></button>\n                        </div>\n            ");
        }
        else if (element.node_type !== 'root') {
            nodeHTML += "\n                <div class=\"node_connector_action\">\n                    <button id=\"".concat(element.id, "\" class=\"node_adder\"></button>\n                </div>\n            ");
        }
        nodeHTML += "\n            </div>\n        ";
        if (element.childrens && element.childrens.length > 0) {
            nodeHTML += element.childrens.length > 1 ? '<div class="multi_group">' : '<div class="single_group">';
            element.childrens.forEach(function (child) {
                nodeHTML += _this.createNode(child);
            });
            nodeHTML += '</div>';
        }
        nodeHTML += '</div>';
        return nodeHTML;
    };
    /**
     * Builds the organizational chart by creating the HTML for all nodes.
     */
    OrganizationChart.prototype.buildChart = function () {
        var rootNodes = this.data.data;
        this.container.innerHTML = this.buildNodes(rootNodes);
    };
    /**
     * Builds the HTML for a list of nodes.
     * @param nodes - The list of nodes.
     * @returns The HTML string for the nodes.
     */
    OrganizationChart.prototype.buildNodes = function (nodes) {
        var _this = this;
        if (!nodes || nodes.length === 0)
            return '';
        return nodes.map(function (node) { return _this.createNode(node); }).join('');
    };
    /**
     * Finds a node by its ID.
     * @param nodes - The list of nodes.
     * @param id - The ID of the node to find.
     * @returns The node data if found, otherwise null.
     */
    OrganizationChart.prototype.findNodeById = function (nodes, id) {
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var node = nodes_1[_i];
            if (node.id === id)
                return node;
            if (node.childrens && node.childrens.length > 0) {
                var found = this.findNodeById(node.childrens, id);
                if (found)
                    return found;
            }
        }
        return null;
    };
    /**
     * Removes a node by its ID.
     * @param nodes - The list of nodes.
     * @param id - The ID of the node to remove.
     * @returns True if the node was removed, otherwise false.
     */
    OrganizationChart.prototype.removeNodeById = function (nodes, id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                nodes.splice(i, 1);
                return true;
            }
            if (nodes[i].childrens && nodes[i].childrens.length > 0) {
                var removed = this.removeNodeById(nodes[i].childrens, id);
                if (removed)
                    return true;
            }
        }
        return false;
    };
    /**
     * Adds a new node to the chart.
     * @param id - The ID of the parent node to add the new node to.
     */
    OrganizationChart.prototype.addNode = function (id) {
        var getData = this.findNodeById(this.data.data, parseInt(id));
        if (!getData) {
            console.error("Node with id ".concat(id, " not found"));
            return;
        }
        var NewData = {
            id: Date.now(),
            stage_name: "New Node",
            node_type: "transitional",
            stage_content: {},
            transition_content: {
                transition_name: "New Transition",
                transition_logic: [{}]
            },
            childrens: []
        };
        if (!getData.childrens)
            getData.childrens = [];
        getData.childrens.push(NewData);
        this.buildChart();
        this.attachEventListeners();
        this.panToNode(NewData.id);
        // Add the new_node class to the newly added node
        var newNodeElement = document.getElementById("node-".concat(NewData.id));
        if (newNodeElement) {
            newNodeElement.classList.add('new_node');
        }
    };
    /**
     * Removes a node from the chart.
     * @param id - The ID of the node to remove.
     */
    OrganizationChart.prototype.removeNode = function (id) {
        var _this = this;
        var nodeElement = document.getElementById("node-".concat(id));
        if (nodeElement) {
            nodeElement.classList.add('node_removing');
            nodeElement.addEventListener('animationend', function () {
                var removed = _this.removeNodeById(_this.data.data, parseInt(id));
                if (removed) {
                    _this.buildChart();
                    _this.attachEventListeners();
                }
            });
        }
    };
    /**
     * Attaches event listeners for adding and removing nodes.
     */
    OrganizationChart.prototype.attachEventListeners = function () {
        var _this = this;
        document.querySelectorAll('.node_adder').forEach(function (button) {
            button.addEventListener('click', function () { return _this.addNode(button.id); });
        });
        document.querySelectorAll('.node_remover').forEach(function (button) {
            button.addEventListener('click', function () { return _this.removeNode(button.id); });
        });
    };
    /**
     * Pans the view to center on a specific node.
     * @param nodeId - The ID of the node to pan to.
     */
    OrganizationChart.prototype.panToNode = function (nodeId) {
        var nodeElement = document.getElementById("node-".concat(nodeId));
        if (nodeElement) {
            var rect = nodeElement.getBoundingClientRect();
            var canvasRect = this.canvas.getBoundingClientRect();
            var offsetX = rect.left - canvasRect.left + rect.width / 2 - canvasRect.width / 2;
            var offsetY = rect.top - canvasRect.top + rect.height / 2 - canvasRect.height / 2;
            this.smoothPan(this.translateX - offsetX, this.translateY - offsetY);
        }
    };
    /**
     * Smoothly pans the view to the target coordinates.
     * @param targetX - The target X coordinate.
     * @param targetY - The target Y coordinate.
     */
    OrganizationChart.prototype.smoothPan = function (targetX, targetY) {
        var _this = this;
        var duration = this.animationTiming; // duration of the animation in ms
        var startX = this.translateX;
        var startY = this.translateY;
        var deltaX = targetX - startX;
        var deltaY = targetY - startY;
        var startTime = performance.now();
        var animate = function (currentTime) {
            var elapsedTime = currentTime - startTime;
            var progress = Math.min(elapsedTime / duration, 1);
            _this.translateX = startX + deltaX * progress;
            _this.translateY = startY + deltaY * progress;
            _this.updateTransform();
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    };
    /**
     * Initializes drag and zoom functionality for the canvas.
     */
    OrganizationChart.prototype.initDragAndZoom = function () {
        var _this = this;
        var startX, startY, lastX, lastY;
        var onMouseMove = this.debounce(function (e) {
            if (!_this.isDragging)
                return;
            e.preventDefault();
            var x = e.pageX;
            var y = e.pageY;
            var dx = x - lastX;
            var dy = y - lastY;
            _this.translateX += dx;
            _this.translateY += dy;
            _this.velocityX = dx;
            _this.velocityY = dy;
            lastX = x;
            lastY = y;
            _this.updateTransform();
        }, 3);
        var onMouseUp = function () {
            _this.isDragging = false;
            _this.applyInertia();
            _this.canvas.removeEventListener('mousemove', onMouseMove);
            _this.canvas.removeEventListener('mouseup', onMouseUp);
        };
        this.canvas.addEventListener('mousedown', function (e) {
            _this.isDragging = true;
            startX = e.pageX;
            startY = e.pageY;
            lastX = startX;
            lastY = startY;
            _this.velocityX = 0;
            _this.velocityY = 0;
            _this.canvas.addEventListener('mousemove', onMouseMove);
            _this.canvas.addEventListener('mouseup', onMouseUp);
        });
        this.canvas.addEventListener('mouseleave', function () {
            if (_this.isDragging) {
                _this.isDragging = false;
                _this.applyInertia();
                _this.canvas.removeEventListener('mousemove', onMouseMove);
                _this.canvas.removeEventListener('mouseup', onMouseUp);
            }
        });
        var zoomHandler = this.debounce(function (e) {
            if (e.ctrlKey) {
                e.preventDefault();
                var rect = _this.canvas.getBoundingClientRect();
                var offsetX = e.clientX - rect.left;
                var offsetY = e.clientY - rect.top;
                var zoomFactor = Math.exp(e.deltaY * -0.005); // Adjusted for smoother zoom
                var newScale = _this.scale * zoomFactor;
                if (newScale >= _this.minScale && newScale <= _this.maxScale) {
                    _this.scale = newScale;
                    _this.translateX = offsetX - (offsetX - _this.translateX) * zoomFactor;
                    _this.translateY = offsetY - (offsetY - _this.translateY) * zoomFactor;
                    _this.container.style.transformOrigin = 'center center';
                    _this.updateTransform();
                }
            }
        }, 5);
        this.canvas.addEventListener('wheel', zoomHandler);
    };
    /**
     * Applies inertia to the canvas scrolling.
     */
    OrganizationChart.prototype.applyInertia = function () {
        var _this = this;
        var friction = 0.95;
        var step = function () {
            if (Math.abs(_this.velocityX) > 0.1 || Math.abs(_this.velocityY) > 0.1) {
                _this.translateX += _this.velocityX;
                _this.translateY += _this.velocityY;
                _this.velocityX *= friction;
                _this.velocityY *= friction;
                _this.updateTransform();
                _this.animationFrameId = requestAnimationFrame(step);
            }
            else {
                _this.velocityX = 0;
                _this.velocityY = 0;
                if (_this.animationFrameId) {
                    cancelAnimationFrame(_this.animationFrameId);
                    _this.animationFrameId = null;
                }
            }
        };
        step();
    };
    /**
     * Updates the transform property of the container to apply translation and scaling.
     */
    OrganizationChart.prototype.updateTransform = function () {
        // this.container.style.transition = `transform 100ms cubic-bezier(0, 0, 0.2, 1)`;
        this.container.style.transform = "translate(".concat(this.translateX, "px, ").concat(this.translateY, "px) scale(").concat(this.scale, ")");
    };
    /**
     * Exports the current data of the organizational chart.
     * @returns The current data of the organizational chart.
     */
    OrganizationChart.prototype.exportData = function () {
        return this.data;
    };
    /**
     * Debounces a function to limit the rate at which it can fire.
     * @param func - The function to debounce.
     * @param wait - The number of milliseconds to wait before allowing the function to be called again.
     * @returns A debounced version of the function.
     */
    OrganizationChart.prototype.debounce = function (func, wait) {
        var _this = this;
        var timeout = null;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (timeout)
                clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                func.apply(_this, args);
            }, wait);
        };
    };
    return OrganizationChart;
}());
// Usage example:
// const canvas = document.getElementById('canvas');
// const data = { /* your data here */ };
// const orgChart = new OrganizationChart(canvas, data);
// console.log(orgChart.exportData());
