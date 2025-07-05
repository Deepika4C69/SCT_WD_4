// Create particle background
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = Math.floor(window.innerWidth / 10);
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 1px and 5px
        const size = Math.random() * 4 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random animation
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
        
        // Add to container
        particlesContainer.appendChild(particle);
    }
}

// Add floating animation to particles
const style = document.createElement('style');
style.innerHTML = `
    @keyframes float {
        0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize particles
createParticles();

// DOM Elements
const taskInput = document.getElementById('task-input');
const taskPriority = document.getElementById('task-priority');
const taskDate = document.getElementById('task-date');
const taskCategory = document.getElementById('task-category');
const taskNotes = document.getElementById('task-notes');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const emptyState = document.getElementById('empty-state');
const addSampleTasksBtn = document.getElementById('add-sample-tasks');
const importTasksBtn = document.getElementById('import-tasks-btn');
const exportTasksBtn = document.getElementById('export-tasks-btn');
const printTasksBtn = document.getElementById('print-tasks-btn');
const clearTasksBtn = document.getElementById('clear-tasks-btn');
const editModal = document.getElementById('edit-modal');
const closeEditModal = document.getElementById('close-edit-modal');
const saveTaskBtn = document.getElementById('save-task-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const importModal = document.getElementById('import-modal');
const exportModal = document.getElementById('export-modal');

// Stats elements
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const overdueTasksEl = document.getElementById('overdue-tasks');

// Edit modal elements
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskPriority = document.getElementById('edit-task-priority');
const editTaskDate = document.getElementById('edit-task-date');
const editTaskCategory = document.getElementById('edit-task-category');
const editTaskNotes = document.getElementById('edit-task-notes');

// Set default date to today
const today = new Date().toISOString().split('T')[0];
taskDate.value = today;

// Initialize tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentSearchTerm = '';
let currentEditIndex = -1;

// Initialize dark mode
const darkMode = localStorage.getItem('darkMode') === 'enabled';
if (darkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Render tasks based on current filter and search
function renderTasks() {
    taskList.innerHTML = '';
    
    const filteredTasks = getFilteredTasks();
    
    // Update stats
    updateStats();
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
    
    // Sort tasks: high priority first, then by date (soonest first), then by creation date
    filteredTasks.sort((a, b) => {
        // Priority sorting (high > medium > low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        
        // Date sorting (tasks with dates come first, then soonest dates)
        if (a.date && b.date) {
            return new Date(a.date) - new Date(b.date);
        }
        if (a.date) return -1;
        if (b.date) return 1;
        
        // Finally, sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Render each task
    filteredTasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
        
        // Add visual indicators for due soon and overdue tasks
        if (!task.completed && task.date) {
            const taskDueDate = new Date(task.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Check if task is overdue
            if (taskDueDate < today) {
                taskItem.classList.add('overdue');
            } 
            // Check if task is due within 3 days
            else {
                const threeDaysFromNow = new Date();
                threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
                if (taskDueDate <= threeDaysFromNow) {
                    taskItem.classList.add('due-soon');
                }
            }
        }
        
        // Drag handle for reordering
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
        dragHandle.draggable = true;
        dragHandle.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => {
                taskItem.classList.add('sortable-ghost');
            }, 0);
        });
        dragHandle.addEventListener('dragend', () => {
            taskItem.classList.remove('sortable-ghost');
        });
        taskItem.appendChild(dragHandle);
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskCompletion(index));
        
        // Task content
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskTitle = document.createElement('div');
        taskTitle.className = 'task-title';
        taskTitle.textContent = task.text;
        
        const taskMeta = document.createElement('div');
        taskMeta.className = 'task-meta';
        
        // Date
        if (task.date) {
            const dateElement = document.createElement('div');
            dateElement.className = 'task-date';
            dateElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(task.date)}`;
            
            // Add overdue badge if task is overdue
            if (!task.completed) {
                const taskDueDate = new Date(task.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (taskDueDate < today) {
                    const daysOverdue = Math.floor((today - taskDueDate) / (1000 * 60 * 60 * 24));
                    dateElement.innerHTML += ` <span class="badge">${daysOverdue}d</span>`;
                }
            }
            
            taskMeta.appendChild(dateElement);
        }
        
        // Priority
        const priorityElement = document.createElement('div');
        priorityElement.className = 'task-priority';
        let priorityIcon, priorityText;
        switch (task.priority) {
            case 'high':
                priorityIcon = '<i class="fas fa-exclamation-circle"></i>';
                priorityText = '<span class="priority-tag priority-high-tag">High</span>';
                break;
            case 'medium':
                priorityIcon = '<i class="fas fa-exclamation-triangle"></i>';
                priorityText = '<span class="priority-tag priority-medium-tag">Medium</span>';
                break;
            default:
                priorityIcon = '<i class="fas fa-arrow-down"></i>';
                priorityText = '<span class="priority-tag priority-low-tag">Low</span>';
        }
        priorityElement.innerHTML = `${priorityIcon} ${priorityText}`;
        taskMeta.appendChild(priorityElement);
        
        // Category
        if (task.category) {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'task-category';
            categoryElement.innerHTML = `<i class="fas fa-tag"></i> <span class="category-tag">${task.category}</span>`;
            taskMeta.appendChild(categoryElement);
        }
        
        // Notes indicator
        if (task.notes) {
            const notesElement = document.createElement('div');
            notesElement.className = 'task-notes';
            notesElement.innerHTML = '<i class="far fa-sticky-note"></i>';
            notesElement.title = task.notes;
            taskMeta.appendChild(notesElement);
        }
        
        taskContent.appendChild(taskTitle);
        taskContent.appendChild(taskMeta);
        
        // Task actions
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        const completeBtn = document.createElement('button');
        completeBtn.className = 'task-btn complete-btn';
        completeBtn.innerHTML = task.completed ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>';
        completeBtn.title = task.completed ? 'Mark as incomplete' : 'Mark as complete';
        completeBtn.addEventListener('click', () => toggleTaskCompletion(index));
        
        const editBtn = document.createElement('button');
        editBtn.className = 'task-btn edit-btn';
        editBtn.innerHTML = '<i class="far fa-edit"></i>';
        editBtn.title = 'Edit task';
        editBtn.addEventListener('click', () => openEditModal(index));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-btn delete-btn';
        deleteBtn.innerHTML = '<i class="far fa-trash-alt"></i>';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', () => confirmDeleteTask(index));
        
        taskActions.appendChild(completeBtn);
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        
        // Assemble task item
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(taskActions);
        
        // Make task item draggable for reordering
        taskItem.draggable = true;
        taskItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => {
                taskItem.classList.add('sortable-ghost');
            }, 0);
        });
        
        taskItem.addEventListener('dragend', () => {
            taskItem.classList.remove('sortable-ghost');
        });
        
        taskItem.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        taskItem.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = e.dataTransfer.getData('text/plain');
            const toIndex = index;
            
            if (fromIndex !== toIndex) {
                const filteredTasks = getFilteredTasks();
                const taskToMove = filteredTasks[fromIndex];
                const actualIndex = tasks.indexOf(taskToMove);
                
                // Remove from old position
                tasks.splice(actualIndex, 1);
                
                // Find new position in full tasks array
                let newPosition;
                if (toIndex >= filteredTasks.length - 1) {
                    newPosition = tasks.length;
                } else {
                    const nextTask = filteredTasks[toIndex];
                    newPosition = tasks.indexOf(nextTask);
                }
                
                // Insert at new position
                tasks.splice(newPosition, 0, taskToMove);
                
                saveTasks();
                renderTasks();
            }
        });
        
        taskList.appendChild(taskItem);
    });
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    // Calculate overdue tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(task => {
        return !task.completed && task.date && new Date(task.date) < today;
    }).length;
    
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
    overdueTasksEl.textContent = overdue;
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    const priority = taskPriority.value;
    const date = taskDate.value;
    const category = taskCategory.value;
    const notes = taskNotes.value.trim();
    
    if (text) {
        const newTask = {
            text,
            priority,
            date: date || null,
            category: category || null,
            notes: notes || null,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask); // Add to beginning of array
        
        saveTasks();
        renderTasks();
        showNotification('Task added successfully!', 'success');
        
        // Reset form
        taskInput.value = '';
        taskPriority.value = 'low';
        taskDate.value = today;
        taskCategory.value = '';
        taskNotes.value = '';
        
        // Focus on input
        taskInput.focus();
    } else {
        showNotification('Please enter a task title', 'error');
    }
}

// Toggle task completion status
function toggleTaskCompletion(index) {
    const task = getTaskFromFilteredIndex(index);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
        
        const action = task.completed ? 'completed' : 'marked incomplete';
        showNotification(`Task "${task.text.substring(0, 20)}..." ${action}`, 'success');
    }
}

// Open edit modal
function openEditModal(index) {
    const task = getTaskFromFilteredIndex(index);
    if (task) {
        currentEditIndex = tasks.indexOf(task);
        
        editTaskTitle.value = task.text;
        editTaskPriority.value = task.priority;
        editTaskDate.value = task.date || '';
        editTaskCategory.value = task.category || '';
        editTaskNotes.value = task.notes || '';
        
        editModal.style.display = 'flex';
    }
}

// Save edited task
function saveEditedTask() {
    if (currentEditIndex >= 0 && currentEditIndex < tasks.length) {
        const newTitle = editTaskTitle.value.trim();
        
        if (newTitle) {
            tasks[currentEditIndex].text = newTitle;
            tasks[currentEditIndex].priority = editTaskPriority.value;
            tasks[currentEditIndex].date = editTaskDate.value || null;
            tasks[currentEditIndex].category = editTaskCategory.value || null;
            tasks[currentEditIndex].notes = editTaskNotes.value.trim() || null;
            
            saveTasks();
            renderTasks();
            closeEditModal.click();
            showNotification('Task updated successfully!', 'success');
        } else {
            showNotification('Task title cannot be empty', 'error');
        }
    }
}

// Delete task
function deleteTask(index) {
    const task = getTaskFromFilteredIndex(index);
    if (task) {
        tasks = tasks.filter(t => t !== task);
        saveTasks();
        renderTasks();
        showNotification('Task deleted', 'warning');
    }
}

// Confirm task deletion
function confirmDeleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(index);
    }
}

// Get task from filtered index
function getTaskFromFilteredIndex(filteredIndex) {
    const filteredTasks = getFilteredTasks();
    return filteredTasks[filteredIndex];
}

// Get filtered tasks based on current filter and search
function getFilteredTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
        // Apply search filter
        if (currentSearchTerm && 
            !task.text.toLowerCase().includes(currentSearchTerm.toLowerCase()) &&
            !(task.notes && task.notes.toLowerCase().includes(currentSearchTerm.toLowerCase()))) {
            return false;
        }
        
        // Apply status filter
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'high') return task.priority === 'high';
        
        // Date filters
        if (currentFilter === 'today') {
            if (!task.date) return false;
            const taskDate = new Date(task.date).toISOString().split('T')[0];
            return taskDate === today.toISOString().split('T')[0];
        }
        
        if (currentFilter === 'week') {
            if (!task.date) return false;
            const taskDueDate = new Date(task.date);
            return taskDueDate >= today && taskDueDate <= endOfWeek;
        }
        
        if (currentFilter === 'overdue') {
            if (!task.date) return false;
            const taskDueDate = new Date(task.date);
            return !task.completed && taskDueDate < today;
        }
        
        return true;
    });
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Add sample tasks
function addSampleTasks() {
    const sampleTasks = [
        {
            text: 'Complete project presentation',
            priority: 'high',
            date: today,
            category: 'work',
            notes: 'Need to include all the latest metrics and update the slides with new design',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            text: 'Buy groceries for the week',
            priority: 'medium',
            date: today,
            category: 'shopping',
            notes: 'Milk, eggs, bread, fruits, vegetables, chicken, pasta',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            text: 'Morning jog in the park',
            priority: 'low',
            date: today,
            category: 'health',
            notes: '30 minutes around the park, remember to stretch afterwards',
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            text: 'Read new book - Atomic Habits',
            priority: 'low',
            category: 'personal',
            notes: 'Finish chapters 5-6, take notes on habit stacking',
            completed: false,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
            text: 'Team meeting - Q3 planning',
            priority: 'medium',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            category: 'work',
            notes: 'Prepare slides on marketing strategy, discuss budget allocations',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            text: 'Dentist appointment',
            priority: 'high',
            date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            category: 'health',
            notes: '3:00 PM at City Dental, bring insurance card',
            completed: false,
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            text: 'Pay electricity bill',
            priority: 'medium',
            date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            category: 'personal',
            notes: 'Due by end of month, can pay online',
            completed: false,
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
        }
    ];
    
    tasks = [...sampleTasks, ...tasks];
    saveTasks();
    renderTasks();
    showNotification('Sample tasks added!', 'success');
}

// Clear all tasks
function clearAllTasks() {
    if (tasks.length === 0) {
        showNotification('No tasks to clear', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
        tasks = [];
        saveTasks();
        renderTasks();
        showNotification('All tasks cleared', 'warning');
    }
}

// Export tasks
function exportTasks() {
    exportModal.style.display = 'flex';
    
    document.getElementById('confirm-export-btn').onclick = () => {
        const format = document.getElementById('export-format').value;
        const filter = document.getElementById('export-filter').value;
        
        let tasksToExport = tasks;
        
        // Apply filter
        if (filter === 'active') {
            tasksToExport = tasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            tasksToExport = tasks.filter(task => task.completed);
        }
        
        let data, filename, mimeType;
        
        if (format === 'json') {
            data = JSON.stringify(tasksToExport, null, 2);
            filename = `tasks-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        } else { // CSV
            const headers = ['Text', 'Priority', 'Due Date', 'Category', 'Completed', 'Created At', 'Notes'];
            const rows = tasksToExport.map(task => {
                return [
                    `"${task.text.replace(/"/g, '""')}"`,
                    task.priority,
                    task.date || '',
                    task.category || '',
                    task.completed ? 'Yes' : 'No',
                    task.createdAt,
                    task.notes ? `"${task.notes.replace(/"/g, '""')}"` : ''
                ];
            });
            
            data = [headers, ...rows].map(row => row.join(',')).join('\n');
            filename = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
        }
        
        // Create download link
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        exportModal.style.display = 'none';
        showNotification(`Tasks exported as ${format.toUpperCase()}`, 'success');
    };
}

// Import tasks
function importTasks() {
    importModal.style.display = 'flex';
    
    document.getElementById('confirm-import-btn').onclick = () => {
        const fileInput = document.getElementById('import-file');
        const format = document.getElementById('import-format').value;
        const overwrite = document.getElementById('import-overwrite').checked;
        
        if (fileInput.files.length === 0) {
            showNotification('Please select a file to import', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                let importedTasks = [];
                
                if (format === 'json') {
                    importedTasks = JSON.parse(e.target.result);
                    if (!Array.isArray(importedTasks)) {
                        throw new Error('Invalid JSON format - expected an array of tasks');
                    }
                } else { // CSV
                    const csvData = e.target.result;
                    const lines = csvData.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                    
                    importedTasks = lines.slice(1).filter(line => line.trim()).map(line => {
                        const values = line.split(',');
                        const task = {};
                        
                        headers.forEach((header, index) => {
                            let value = values[index] || '';
                            // Remove surrounding quotes if present
                            if (value.startsWith('"') && value.endsWith('"')) {
                                value = value.substring(1, value.length - 1);
                                // Handle escaped quotes
                                value = value.replace(/""/g, '"');
                            }
                            
                            // Convert empty strings to null for optional fields
                            if (value === '') {
                                value = null;
                            }
                            
                            // Convert completed status to boolean
                            if (header === 'Completed') {
                                value = value === 'Yes';
                            }
                            
                            task[header.toLowerCase().replace(' ', '')] = value;
                        });
                        
                        return task;
                    });
                }
                
                if (overwrite) {
                    tasks = importedTasks;
                } else {
                    tasks = [...importedTasks, ...tasks];
                }
                
                saveTasks();
                renderTasks();
                importModal.style.display = 'none';
                showNotification(`Successfully imported ${importedTasks.length} tasks`, 'success');
            } catch (error) {
                console.error('Error importing tasks:', error);
                showNotification(`Error importing tasks: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = () => {
            showNotification('Error reading file', 'error');
        };
        
        if (format === 'json') {
            reader.readAsText(file);
        } else {
            reader.readAsText(file);
        }
    };
}

// Print tasks
function printTasks() {
    window.print();
}

// Show notification
function showNotification(message, type = 'success') {
    notification.className = `notification ${type}`;
    notificationMessage.textContent = message;
    notification.querySelector('i').className = 
        type === 'error' ? 'fas fa-exclamation-circle' :
        type === 'warning' ? 'fas fa-exclamation-triangle' :
        'fas fa-check-circle';
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Event listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

searchInput.addEventListener('input', () => {
    currentSearchTerm = searchInput.value.trim();
    renderTasks();
});

addSampleTasksBtn.addEventListener('click', addSampleTasks);
importTasksBtn.addEventListener('click', importTasks);
exportTasksBtn.addEventListener('click', exportTasks);
printTasksBtn.addEventListener('click', printTasks);
clearTasksBtn.addEventListener('click', clearAllTasks);

closeEditModal.addEventListener('click', () => {
    editModal.style.display = 'none';
    currentEditIndex = -1;
});

saveTaskBtn.addEventListener('click', saveEditedTask);

deleteTaskBtn.addEventListener('click', () => {
    if (currentEditIndex >= 0 && currentEditIndex < tasks.length) {
        tasks.splice(currentEditIndex, 1);
        saveTasks();
        renderTasks();
        closeEditModal.click();
        showNotification('Task deleted', 'warning');
    }
});

darkModeToggle.addEventListener('click', toggleDarkMode);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.style.display = 'none';
        currentEditIndex = -1;
    }
    if (e.target === importModal) {
        importModal.style.display = 'none';
    }
    if (e.target === exportModal) {
        exportModal.style.display = 'none';
    }
});

// Close export modal
document.getElementById('close-export-modal').addEventListener('click', () => {
    exportModal.style.display = 'none';
});

document.getElementById('cancel-export-btn').addEventListener('click', () => {
    exportModal.style.display = 'none';
});

// Close import modal
document.getElementById('close-import-modal').addEventListener('click', () => {
    importModal.style.display = 'none';
});

document.getElementById('cancel-import-btn').addEventListener('click', () => {
    importModal.style.display = 'none';
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Initialize deferredPrompt for use later to show browser install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install prompt modal
    document.getElementById('install-prompt').style.display = 'flex';
});

document.getElementById('confirm-install-btn').addEventListener('click', () => {
    // Hide the install prompt modal
    document.getElementById('install-prompt').style.display = 'none';
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        // Clear the deferredPrompt variable
        deferredPrompt = null;
    });
});

document.getElementById('cancel-install-btn').addEventListener('click', () => {
    document.getElementById('install-prompt').style.display = 'none';
});

document.getElementById('close-install-prompt').addEventListener('click', () => {
    document.getElementById('install-prompt').style.display = 'none';
});

// Initial render
renderTasks();