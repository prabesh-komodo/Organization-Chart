'use strict';

const flow = (canvas, data) => {
    const getCanvas = canvas;

    const container = document.createElement('div');
    container.classList.add('contents');

    const createNode = (element) => {

        let className = `node ${element.node_type}_node`;
        
        let nodeHTML = '';

        if(element.node_type === 'root'){
            nodeHTML += `
            <div class="${className}" id="node-${element.id}">
        `;
        }else {
             nodeHTML += `
            <div class="${className}" id="node-${element.id}">
            <button id=${element.id} class="node_remover">X</button>
        `;
        }

        if (element.node_type === 'transitional' && element.transition_content) {

            let transitionContentClass;
            if(element.transition_content.transition_logic && element.transition_content.transition_logic.length < 1){
                transitionContentClass = 'transitional_content transition_error';
            }else{
                transitionContentClass = 'transitional_content';
            }
            
            nodeHTML += `
                <div class="${transitionContentClass}">
                    ${element.transition_content.transition_name || ''}
                </div>
            `;
            if(element.transition_content.transition_logic && element.transition_content.transition_logic.length < 1){
                nodeHTML += `
                <div class="error-container">
                    Transition logic has not been implemented yet.
                </div>
            `;
            }
            nodeHTML += `
                <div class="node_connector"></div>
            `;
        }

        nodeHTML += `
            <div class="node_content">
                <h2>${element.stage_name}</h2>
            </div>
            <div class="node_connector ${element.childrens && element.childrens.length > 1 ? 'actionable' : ''}">
        `;  

        if(element.node_type === 'root' && element.childrens && element.childrens.length === 0){
            nodeHTML += `
                        <div class="node_connector_action">
                            <button id=${element.id} class="node_adder"></button>
                        </div>
            `;
        } else if (element.node_type !== 'root') {
            nodeHTML += `
                <div class="node_connector_action">
                    <button id=${element.id} class="node_adder"></button>
                </div>
            `;
        }

        nodeHTML += `
               </div>
        `;

        if (element.childrens && element.childrens.length > 0) {
            if(element.childrens.length > 1) {
                nodeHTML += '<div class="multi_group">';
            }else{
                nodeHTML += '<div class="single_group">';
            }
            element.childrens.forEach(child => {
                nodeHTML += createNode(child);
            });
            nodeHTML += '</div>';
        }

        nodeHTML += '</div>';

        return nodeHTML;
    };

    const buildChart = (nodes) => {
        if (!nodes || nodes.length === 0) return '';
        let chartHTML = '';
        nodes.forEach(node => {
            chartHTML += createNode(node);
        });
        return chartHTML;
    };

    const findNodeById = (nodes, id) => {
        for (let node of nodes) {
            if (node.id === id) {
                return node;
            }
            if (node.childrens && node.childrens.length > 0) {
                const found = findNodeById(node.childrens, id);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };

    const removeNodeById = (nodes, id) => {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                nodes.splice(i, 1);
                return true;
            }
            if (nodes[i].childrens && nodes[i].childrens.length > 0) {
                const removed = removeNodeById(nodes[i].childrens, id);
                if (removed) {
                    return true;
                }
            }
        }
        return false;
    };



    function addNodes(id, nodes) {
        let getData = findNodeById(nodes, parseInt(id));

        let NewData = {
            "id": Date.now(), // Use a unique ID
            "stage_name": "New Node",
            "node_type": "transitional",
            "stage_content" : {},
            "transition_content": {
                "transition_name": "New Transition",
                "transition_logic": [{}]
            },
            "childrens": []
        };

        if (getData) {
            if (!getData.childrens) {
                getData.childrens = [];
            }
            getData.childrens.push(NewData);
            console.log(getData);
            // Rebuild the chart
            container.innerHTML = buildChart(rootNodes);
            // Re-attach event listeners
            attachEventListeners();
            panToNode(NewData.id);
        }
    }

    function removeNodes(id, nodes) {
        console.log(id);
        const removed = removeNodeById(nodes, parseInt(id));
        if (removed) {
            console.log(`Node with id ${id} removed`);
            // Rebuild the chart
            container.innerHTML = buildChart(rootNodes);
            // Re-attach event listeners
            attachEventListeners();
        }
    }

    function attachEventListeners() {
        document.querySelectorAll('.node_adder').forEach(button => {
            button.addEventListener('click', function(){
                addNodes(button.id, rootNodes);
            });
        });
        document.querySelectorAll('.node_remover').forEach(button => {
            button.addEventListener('click', function(){
                removeNodes(button.id, rootNodes);
            });
        });
    }

    function panToNode(nodeId) {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement) {
            const rect = nodeElement.getBoundingClientRect();
            const canvasRect = getCanvas.getBoundingClientRect();
            const offsetX = rect.left - canvasRect.left + rect.width / 2 - canvasRect.width / 2;
            const offsetY = rect.top - canvasRect.top + rect.height / 2 - canvasRect.height / 2;
            getCanvas.scrollLeft += offsetX;
            getCanvas.scrollTop += offsetY;
        }
    }

    // Start building the chart from the root nodes
    const rootNodes = data.data;
    let chartHTML = buildChart(rootNodes);

    container.innerHTML = chartHTML;

    getCanvas.appendChild(container);

    // Attach event listeners
    attachEventListeners();

    // Dragging functionality
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    getCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - getCanvas.offsetLeft;
        startY = e.pageY - getCanvas.offsetTop;
        scrollLeft = getCanvas.scrollLeft;
        scrollTop = getCanvas.scrollTop;
    });

    getCanvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    getCanvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    getCanvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - getCanvas.offsetLeft;
        const y = e.pageY - getCanvas.offsetTop;
        const walkX = (x - startX) * 1; //scroll-fast
        const walkY = (y - startY) * 1; //scroll-fast
        getCanvas.scrollLeft = scrollLeft - walkX;
        getCanvas.scrollTop = scrollTop - walkY;
    });

   // Zooming functionality
    let scale = 1;
    const zoomHandler = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            const originX = offsetX / rect.width * 100;
            const originY = offsetY / rect.height * 100;

            scale += e.deltaY * -0.01;
            scale = Math.min(Math.max(1, scale), 4); // Set minimum scale to 1
            container.style.transformOrigin = `${originX}% ${originY}%`;
            container.style.transform = `scale(${scale})`;
        }
    };

    getCanvas.addEventListener('wheel', zoomHandler);
};