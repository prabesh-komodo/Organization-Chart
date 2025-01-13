/**
 * Interface representing the transition content of a node.
 */
interface TransitionContent {
    transition_name: string;
    transition_logic: any[];
}

/**
 * Interface representing a node in the organizational chart.
 */
interface NodeData {
    id: number;
    stage_name: string;
    node_type: string;
    stage_content: any;
    transition_content?: TransitionContent;
    childrens: NodeData[];
}

/**
 * Interface representing the data structure of the organizational chart.
 */
interface OrgChartData {
    data: NodeData[];
}

type NodeContentGenerator = (node: NodeData) => string;
type TransitionContentGenerator = (transitionContent: TransitionContent) => string;

/**
 * Class representing the organizational chart.
 */
class OrganizationChart {
    private canvas: HTMLElement;
    private data: OrgChartData;
    private container: HTMLElement;
    private scale: number;
    private translateX: number;
    private translateY: number;
    private velocityX: number;
    private velocityY: number;
    private isDragging: boolean;
    private animationFrameId: number | null;
    private minScale: number;
    private maxScale: number;
    private animationTiming: number;
    private generateNodeContent: NodeContentGenerator;
    private generateTransitionContent: TransitionContentGenerator;

    /**
     * Creates an instance of OrganizationChart.
     * @param canvas - The HTML element where the chart will be rendered.
     * @param data - The data for the organizational chart.
     */
    constructor(canvas: HTMLElement, data: OrgChartData, generateNodeContent: NodeContentGenerator, generateTransitionContent: TransitionContentGenerator) {
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
    private init() {
        this.buildChart();
        this.canvas.appendChild(this.container);
        this.attachEventListeners();
        this.initDragAndZoom();
        // this.centerContent();
    }

    /**
     * Creates the HTML for a node.
     * @param element - The node data.
     * @returns The HTML string for the node.
     */
    private createNode(element: NodeData): string {
        let className = `node ${element.node_type}_node`;

        let nodeHTML = `<div class="${className}" id="node-${element.id}">`;

        if (element.node_type === 'transitional' && element.transition_content) {
            let transitionContentClass = element.transition_content.transition_logic && element.transition_content.transition_logic.length < 1
                ? 'transitional_content transition_error slds-card'
                : 'transitional_content slds-card';

            nodeHTML += `
                <div class="${transitionContentClass}">
                    <div class="slds-card__header slds-grid">
                        <header class="slds-media slds-media_center slds-has-flexi-truncate">
                        <div class="slds-media__figure">
                            <span class="slds-icon_container slds-icon-transition" title="account">
                                <svg class="slds-icon slds-icon_small" aria-hidden="true">
                                    <use xlink:href="/assets/icons/standard-sprite/svg/symbols.svg#account"></use>
                                </svg>
                                <span class="slds-assistive-text">account</span>
                            </span>
                        </div>
                        <div class="slds-media__body">
                            <h2 class="slds-card__header-title">
                                <a href="#" class="slds-card__header-link slds-truncate" title="${element.transition_content.transition_name}">
                                    <span>${element.transition_content.transition_name}</span>
                                </a>
                            </h2>
                        </div>
                        <div class="slds-no-flex">
                            <button class="slds-button slds-button_neutral" id="${element.id}">Edit</button>
                        </div>
                    </header>
                    </div>
                </div>
            `;

            if (element.transition_content.transition_logic && element.transition_content.transition_logic.length < 1) {
                nodeHTML += `
                <div class="error-container">
                    Transition logic has not been implemented yet.
                </div>
            `;
            }

            nodeHTML += `<div class="node_connector node_connector_transition-block ${element.transition_content && element.transition_content.transition_logic && element.transition_content.transition_logic.length < 1 ? 'node_error' : ''}"></div>`;
        }

        nodeHTML += `
            <article class="node_content slds-card">
                <div class="slds-card__header slds-grid">
                    <header class="slds-media slds-media_center slds-has-flexi-truncate">
                        <div class="slds-media__figure">
                            <span class="slds-icon_container slds-icon-standard-account" title="account">
                                <svg class="slds-icon slds-icon_small" aria-hidden="true">
                                    <use xlink:href="/assets/icons/standard-sprite/svg/symbols.svg#account"></use>
                                </svg>
                                <span class="slds-assistive-text">account</span>
                            </span>
                        </div>
                        <div class="slds-media__body">
                            <h2 class="slds-card__header-title">
                                <a href="#" class="slds-card__header-link slds-truncate" title="${element.stage_name}">
                                    <span>${element.stage_name}</span>
                                </a>
                            </h2>
                        </div>
                        <div class="slds-no-flex">
                            ${element.node_type !== 'root' ? `<button class="slds-button slds-button_neutral node_remover" id="${element.id}">Delete</button>` : '' }
                        </div>
                    </header>
                </div>
                <div class="slds-card__body slds-card__body_inner">
                    ${this.generateNodeContent(element)}
                </div>
            </article>
            <div class="node_connector ${element.childrens && element.childrens.length > 1 ? 'actionable' : ''}">
        `;  

        if(element.node_type === 'root' && element.childrens && element.childrens.length === 0){
            nodeHTML += `
                        <div class="node_connector_action">
                            <button id="${element.id}" class="node_adder" data-tooltip="Add a new workflow stage">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.23047 8.92278L14.3074 8.92278C14.5535 8.92278 14.7689 8.70739 14.7689 8.46124L14.7689 7.53816C14.7689 7.29201 14.5535 7.07662 14.3074 7.07662L9.23047 7.07662C9.04585 7.07662 8.92278 6.95355 8.92278 6.76893L8.92278 1.69201C8.92278 1.44585 8.70739 1.23047 8.46124 1.23047L7.53816 1.23047C7.29201 1.23047 7.07662 1.44585 7.07662 1.69201L7.07662 6.76893C7.07662 6.95355 6.95355 7.07662 6.76893 7.07662L1.69201 7.07662C1.44585 7.07662 1.23047 7.29201 1.23047 7.53816L1.23047 8.46124C1.23047 8.70739 1.44585 8.92278 1.69201 8.92278L6.76893 8.92278C6.95355 8.92278 7.07662 9.04585 7.07662 9.23047L7.07662 14.3074C7.07662 14.5535 7.29201 14.7689 7.53816 14.7689L8.46124 14.7689C8.70739 14.7689 8.92278 14.5535 8.92278 14.3074L8.92278 9.23047C8.92278 9.04585 9.04585 8.92278 9.23047 8.92278Z" fill="#014486"/>
                                </svg>
                            </button>
                        </div>
            `;
        } else if (element.node_type !== 'root') {
            nodeHTML += `
                <div class="node_connector_action">
                    <button id="${element.id}" class="node_adder" data-tooltip="Add a new workflow stage">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.23047 8.92278L14.3074 8.92278C14.5535 8.92278 14.7689 8.70739 14.7689 8.46124L14.7689 7.53816C14.7689 7.29201 14.5535 7.07662 14.3074 7.07662L9.23047 7.07662C9.04585 7.07662 8.92278 6.95355 8.92278 6.76893L8.92278 1.69201C8.92278 1.44585 8.70739 1.23047 8.46124 1.23047L7.53816 1.23047C7.29201 1.23047 7.07662 1.44585 7.07662 1.69201L7.07662 6.76893C7.07662 6.95355 6.95355 7.07662 6.76893 7.07662L1.69201 7.07662C1.44585 7.07662 1.23047 7.29201 1.23047 7.53816L1.23047 8.46124C1.23047 8.70739 1.44585 8.92278 1.69201 8.92278L6.76893 8.92278C6.95355 8.92278 7.07662 9.04585 7.07662 9.23047L7.07662 14.3074C7.07662 14.5535 7.29201 14.7689 7.53816 14.7689L8.46124 14.7689C8.70739 14.7689 8.92278 14.5535 8.92278 14.3074L8.92278 9.23047C8.92278 9.04585 9.04585 8.92278 9.23047 8.92278Z" fill="#014486"/>
                        </svg>
                    </button>
                </div>
            `;
        }

        nodeHTML += `
            </div>
        `;

        if (element.childrens && element.childrens.length > 0) {
            nodeHTML += element.childrens.length > 1 ? '<div class="multi_group">' : '<div class="single_group">';
            element.childrens.forEach(child => {
                nodeHTML += this.createNode(child);
            });
            nodeHTML += '</div>';
        }

        nodeHTML += '</div>';
        return nodeHTML;
    }

    /**
     * Builds the organizational chart by creating the HTML for all nodes.
     */
    private buildChart() {
        const rootNodes = this.data.data;
        this.container.innerHTML = this.buildNodes(rootNodes);
    }

    /**
     * Builds the HTML for a list of nodes.
     * @param nodes - The list of nodes.
     * @returns The HTML string for the nodes.
     */
    private buildNodes(nodes: NodeData[]): string {
        if (!nodes || nodes.length === 0) return '';
        return nodes.map(node => this.createNode(node)).join('');
    }

    /**
     * Finds a node by its ID.
     * @param nodes - The list of nodes.
     * @param id - The ID of the node to find.
     * @returns The node data if found, otherwise null.
     */
    private findNodeById(nodes: NodeData[], id: number): NodeData | null {
        for (let node of nodes) {
            if (node.id === id) return node;
            if (node.childrens && node.childrens.length > 0) {
                const found = this.findNodeById(node.childrens, id);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Removes a node by its ID.
     * @param nodes - The list of nodes.
     * @param id - The ID of the node to remove.
     * @returns True if the node was removed, otherwise false.
     */
    private removeNodeById(nodes: NodeData[], id: number): boolean {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                nodes.splice(i, 1);
                return true;
            }
            if (nodes[i].childrens && nodes[i].childrens.length > 0) {
                const removed = this.removeNodeById(nodes[i].childrens, id);
                if (removed) return true;
            }
        }
        return false;
    }

    /**
     * Adds a new node to the chart.
     * @param id - The ID of the parent node to add the new node to.
     */
    public addNode(id: string) {
        setTimeout(() => {
            document.querySelectorAll('.tooltip').forEach(tooltip => tooltip.remove());
        },1);

        document.querySelectorAll('.tooltip').forEach(tooltip => tooltip.remove());
        
        let getData = this.findNodeById(this.data.data, parseInt(id));
        if (!getData) {
            console.error(`Node with id ${id} not found`);
            return;
        }

        let NewData: NodeData = {
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

        if (!getData.childrens) getData.childrens = [];
        getData.childrens.push(NewData);
        this.buildChart();
        this.attachEventListeners();
        this.panToNode(NewData.id);

         // Add the new_node class to the newly added node
         const newNodeElement = document.getElementById(`node-${NewData.id}`);
         if (newNodeElement) {
             newNodeElement.classList.add('new_node');
         }
    }

    /**
     * Removes a node from the chart.
     * @param id - The ID of the node to remove.
     */
    public removeNode(id: string) {
        const nodeElement = document.getElementById(`node-${id}`);
        if (nodeElement) {
            nodeElement.classList.add('node_removing');
            nodeElement.addEventListener('animationend', () => {
                const removed = this.removeNodeById(this.data.data, parseInt(id));
                if (removed) {
                    this.buildChart();
                    this.attachEventListeners();
                }
            });
        }
    }

    /**
     * Attaches event listeners for adding and removing nodes.
     */
    private attachEventListeners() {
        document.querySelectorAll('.node_adder').forEach(button => {
            button.addEventListener('click', (event) => {
                this.addNode(button.id);
            });
            button.addEventListener('mouseenter', (event) => this.showTooltip(event as MouseEvent));
            button.addEventListener('mouseleave', (event) => this.hideTooltip(event as MouseEvent));
        });
        document.querySelectorAll('.node_remover').forEach(button => {
            button.addEventListener('click', () => this.removeNode(button.id));
        });
    
    }

    private showTooltip(event: MouseEvent) {
        const target = event.currentTarget as HTMLElement;
        const tooltipText = target.getAttribute('data-tooltip');
        if (tooltipText) {
            let tooltip = document.createElement('div');
            tooltip.id = `tooltip-${Date.now()}`;
            tooltip.className = 'tooltip';
            tooltip.innerText = tooltipText;
            document.body.appendChild(tooltip);
    
            const rect = target.getBoundingClientRect();
            tooltip.style.left = `${rect.right + window.scrollX + 10}px`;
            tooltip.style.top = `${rect.top + window.scrollY + rect.height / 2 - tooltip.offsetHeight / 2}px`;
    
            tooltip.classList.add('show');
            target.setAttribute('data-tooltip-id', tooltip.id);
        }
    }
    
    private hideTooltip(event: MouseEvent) {
        const target = event.currentTarget as HTMLElement;
        const tooltipId = target.getAttribute('data-tooltip-id');
        if (tooltipId) {
            const tooltip = document.getElementById(tooltipId);
            if (tooltip) {
                tooltip.remove();
            }
            target.removeAttribute('data-tooltip-id');
        }
    }

    /**
     * Pans the view to center on a specific node.
     * @param nodeId - The ID of the node to pan to.
     */
    private panToNode(nodeId: number) {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement) {
            const rect = nodeElement.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            const offsetX = rect.left - canvasRect.left + rect.width / 2 - canvasRect.width / 2;
            const offsetY = rect.top - canvasRect.top + rect.height / 2 - canvasRect.height / 2;
            this.smoothPan(this.translateX - offsetX, this.translateY - offsetY);
        }
    }

    /**
     * Smoothly pans the view to the target coordinates.
     * @param targetX - The target X coordinate.
     * @param targetY - The target Y coordinate.
     */
    private smoothPan(targetX: number, targetY: number) {
        const duration = this.animationTiming; // duration of the animation in ms
        const startX = this.translateX;
        const startY = this.translateY;
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            this.translateX = startX + deltaX * progress;
            this.translateY = startY + deltaY * progress;
            this.updateTransform();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Initializes drag and zoom functionality for the canvas.
     */
    private initDragAndZoom() {
        let startX: number, startY: number, lastX: number, lastY: number;

        const onMouseMove = this.debounce((e: MouseEvent) => {
            if (!this.isDragging) return;
            e.preventDefault();
            const x = e.pageX;
            const y = e.pageY;
            const dx = x - lastX;
            const dy = y - lastY;
            this.translateX += dx;
            this.translateY += dy;
            this.velocityX = dx;
            this.velocityY = dy;
            lastX = x;
            lastY = y;
            this.updateTransform();
        }, 3);

        const onMouseUp = () => {
            this.isDragging = false;
            this.applyInertia();
            this.canvas.removeEventListener('mousemove', onMouseMove);
            this.canvas.removeEventListener('mouseup', onMouseUp);
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            startX = e.pageX;
            startY = e.pageY;
            lastX = startX;
            lastY = startY;
            this.velocityX = 0;
            this.velocityY = 0;
            this.canvas.addEventListener('mousemove', onMouseMove);
            this.canvas.addEventListener('mouseup', onMouseUp);
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.applyInertia();
                this.canvas.removeEventListener('mousemove', onMouseMove);
                this.canvas.removeEventListener('mouseup', onMouseUp);
            }
        });

        const zoomHandler = this.debounce((e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                const zoomFactor = Math.exp(e.deltaY * -0.005); // Adjusted for smoother zoom
                const newScale = this.scale * zoomFactor;
    
                if (newScale >= this.minScale && newScale <= this.maxScale) {
                    this.scale = newScale;
                    this.translateX = offsetX - (offsetX - this.translateX) * zoomFactor;
                    this.translateY = offsetY - (offsetY - this.translateY) * zoomFactor;
                    this.container.style.transformOrigin =  'center center';
                    this.updateTransform();
                }
            }
        }, 5);

        this.canvas.addEventListener('wheel', zoomHandler);
    }

    /**
     * Applies inertia to the canvas scrolling.
     */
    private applyInertia() {
        const friction = 0.95;
        const step = () => {
            if (Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1) {
                this.translateX += this.velocityX;
                this.translateY += this.velocityY;
                this.velocityX *= friction;
                this.velocityY *= friction;
                this.updateTransform();
                this.animationFrameId = requestAnimationFrame(step);
            } else {
                this.velocityX = 0;
                this.velocityY = 0;
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
            }
        };
        step();
    }

    /**
     * Updates the transform property of the container to apply translation and scaling.
     */
    private updateTransform() {
        // this.container.style.transition = `transform 100ms cubic-bezier(0, 0, 0.2, 1)`;
        this.container.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }

    /**
     * Exports the current data of the organizational chart.
     * @returns The current data of the organizational chart.
     */
    public exportData(): OrgChartData {
        return this.data;
    }

    /**
     * Debounces a function to limit the rate at which it can fire.
     * @param func - The function to debounce.
     * @param wait - The number of milliseconds to wait before allowing the function to be called again.
     * @returns A debounced version of the function.
     */
    private debounce(func: Function, wait: number) {
        let timeout: number | null = null;
        return (...args: any[]) => {
            if (timeout) clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                func.apply(this, args);
            }, wait);
        };
    }

    // private centerContent() {
    //     const canvasRect = this.canvas.getBoundingClientRect();
    //     const containerRect = this.container.getBoundingClientRect();
    //     const offsetX = (canvasRect.width - containerRect.width) / 2;
    //     const offsetY = (canvasRect.height - containerRect.height) / 2;
    //     this.canvas.scrollLeft = offsetX;
    //     this.canvas.scrollTop = offsetY;
    // }
}

// Usage example:
// const canvas = document.getElementById('canvas');
// const data = { /* your data here */ };
// const orgChart = new OrganizationChart(canvas, data);
// console.log(orgChart.exportData());