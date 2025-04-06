// ==========================================
// GLOBAL VARIABLES
// ==========================================
let currentUser = null;
let allUsers = [];
let allTasks = [];
let activePage = 'my-tasks';

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const loginForm = document.getElementById('login-form');
const taskApp = document.getElementById('task-app');
const taskForm = document.getElementById('task-form');
const userTasksList = document.getElementById('user-tasks-list');
const allTasksList = document.getElementById('all-tasks-list');
const categoryTasksList = document.getElementById('category-tasks-list');
const categoryFilter = document.getElementById('category-filter');
const categoryNameDisplay = document.getElementById('category-name-display');
const logoutButton = document.getElementById('logout-button');
const myTasksNav = document.getElementById('my-tasks-nav');
const allTasksNav = document.getElementById('all-tasks-nav');
const filterTasksNav = document.getElementById('filter-tasks-nav');
const userTasksSection = document.getElementById('user-tasks');
const allTasksSection = document.getElementById('all-tasks');
const categoryTasksSection = document.getElementById('category-tasks');

// UTILITY FUNCTIONS
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function formatDate(date) {
    return date.toLocaleString();
}

function getNextTaskId() {
    const maxId = allTasks.reduce((max, task) => (task.id > max ? task.id : max), 0);
    return maxId + 1;
}

// API FUNCTIONS
async function loadUsersFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) throw new Error(`Failed to load users: ${response.statusText}`);
        const data = await response.json();
        allUsers = Array.isArray(data) ? data : [];
        return allUsers;
    } catch (error) {
        console.error('Error loading users:', error);
        allUsers = [];
        throw error;
    }
}

async function loadTasksFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) throw new Error(`Failed to load tasks: ${response.statusText}`);
        const data = await response.json();
        allTasks = Array.isArray(data) ? data : [];
        return allTasks;
    } catch (error) {
        console.error('Error loading tasks:', error);
        allTasks = [];
        throw error;
    }
}

async function saveUsersToServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allUsers)
        });
        if (!response.ok) throw new Error(`Failed to save users: ${response.statusText}`);
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        throw error;
    }
}

async function saveTasksToServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allTasks)
        });
        if (!response.ok) throw new Error(`Failed to save tasks: ${response.statusText}`);
        return true;
    } catch (error) {
        console.error('Error saving tasks:', error);
        throw error;
    }
}

// USER MANAGEMENT
async function loginUser(user) {
    currentUser = user;
    
    // Save to session storage
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    // Update welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.displayName}`;
    }

    // Show task app
    loginForm.classList.add('hidden');
    taskApp.classList.remove('hidden');

    // Show user tasks
    showPage('my-tasks');
    
    showNotification(`Welcome, ${user.displayName}!`);
}

async function checkLoggedInUser() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            const user = allUsers.find(u => u.username === userData.username);
            if (user) {
                await loginUser(user);
                return true;
            } else {
                sessionStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            sessionStorage.removeItem('currentUser');
        }
    }
    return false;
}

// TASK MANAGEMENT
function showPage(page) {
    // Update active page
    activePage = page;

    // Hide all sections
    userTasksSection.classList.add('hidden');
    allTasksSection.classList.add('hidden');
    categoryTasksSection.classList.add('hidden');

    // Remove active class from navigation
    myTasksNav.classList.remove('active');
    allTasksNav.classList.remove('active');
    filterTasksNav.classList.remove('active');

    // Show selected section and update navigation
    if (page === 'my-tasks') {
        userTasksSection.classList.remove('hidden');
        myTasksNav.classList.add('active');
        renderUserTasks();
    } else if (page === 'all-tasks') {
        allTasksSection.classList.remove('hidden');
        allTasksNav.classList.add('active');
        renderAllTasks();
    } else if (page === 'filter-tasks') {
        categoryTasksSection.classList.remove('hidden');
        filterTasksNav.classList.add('active');
        // If there's already a category filter applied, refresh it
        const categoryInput = document.getElementById('category-name');
        if (categoryInput.value.trim()) {
            handleCategoryFilter({ preventDefault: () => {} });
        }
    }
}

function renderUserTasks() {
    const userTasks = allTasks.filter(task => task.assignee === currentUser.username);
    renderTaskList(userTasksList, userTasks);
}

function renderAllTasks() {
    renderTaskList(allTasksList, allTasks);
}

function renderTaskList(container, tasks) {
    // Clear the container
    container.innerHTML = '';

    // Check if there are any tasks
    if (!Array.isArray(tasks) || tasks.length === 0) {
        container.innerHTML = '<div class="empty-message">No tasks found</div>';
        return;
    }

    // Sort tasks: pending first, then by creation date (newest first)
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === 'pending' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'pending') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Create task elements
    sortedTasks.forEach(task => {
        container.appendChild(createTaskElement(task));
    });
}

function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
    taskItem.dataset.id = task.id;

    // Find user display names
    const creator = allUsers.find(user => user.username === task.createdBy);
    const assignee = allUsers.find(user => user.username === task.assignee);

    // Format dates
    const createdDate = new Date(task.createdAt);

    taskItem.innerHTML = `
        <div class="task-header">
            <span class="task-status ${task.status === 'completed' ? 'completed-status' : 'pending-status'}">
                ${task.status === 'completed' ? 'Completed' : 'Pending'}
            </span>
        </div>
        <div class="task-description">${task.description}</div>
        <div class="task-meta">
            <span>Category: ${task.category}</span>
            <span>Assignee: ${assignee ? assignee.displayName : task.assignee}</span>
        </div>
        <div class="task-dates">
            <span>Created: ${formatDate(createdDate)} by ${creator ? creator.displayName : task.createdBy}</span>
        </div>
        <div class="task-actions">
            ${task.status === 'pending'
                ? `<button class="btn btn-success complete-task">Complete</button>`
                : `<button class="btn btn-secondary reopen-task">Reopen</button>`}
            <button class="btn btn-primary reassign-task">Reassign</button>
            <button class="btn btn-danger delete-task">Delete</button>
        </div>
    `;

    // Add event listeners
    const completeButton = taskItem.querySelector('.complete-task');
    const reopenButton = taskItem.querySelector('.reopen-task');
    const reassignButton = taskItem.querySelector('.reassign-task');
    const deleteButton = taskItem.querySelector('.delete-task');

    if (completeButton) {
        completeButton.addEventListener('click', () => handleCompleteTask(task.id));
    }

    if (reopenButton) {
        reopenButton.addEventListener('click', () => handleReopenTask(task.id));
    }

    if (reassignButton) {
        reassignButton.addEventListener('click', () => {
            const newAssignee = prompt("Enter username to reassign task:");
            if (newAssignee) handleReassignTask(task.id, newAssignee);
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', () => handleDeleteTask(task.id));
    }

    return taskItem;
}

// Handle category filter
function handleCategoryFilter(e) {
    if (e.preventDefault) e.preventDefault();

    const categoryName = document.getElementById('category-name').value.trim();

    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }

    // Set the category name in the display
    categoryNameDisplay.textContent = categoryName;

    // Filter tasks by the selected category
    const categoryTasks = allTasks.filter(task =>
        task.category.toLowerCase() === categoryName.toLowerCase()
    );

    // Render the filtered tasks
    renderTaskList(categoryTasksList, categoryTasks);
}

// EVENT HANDLERS
async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();

    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }

    const user = allUsers.find(u => u.username === username);

    if (user) {
        await loginUser(user);
    } else {
        // Create a new user
        const newUser = {
            username,
            displayName: username.charAt(0).toUpperCase() + username.slice(1)
        };
        allUsers.push(newUser);

        try {
            await saveUsersToServer();
            await loginUser(newUser);
        } catch (error) {
            showNotification('Failed to create user', 'error');
        }
    }
}

async function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    loginForm.classList.remove('hidden');
    taskApp.classList.add('hidden');
    showNotification('You have been logged out');
}

async function handleAddTask(e) {
    e.preventDefault();

    const description = document.getElementById('task-description').value.trim();
    const category = document.getElementById('task-category').value.trim() || 'General';

    if (!description) {
        showNotification('Please enter a task description', 'error');
        return;
    }

    const newTask = {
        id: getNextTaskId(),
        description,
        category,
        assignee: currentUser.username,
        status: 'pending',
        createdBy: currentUser.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    allTasks.push(newTask);

    try {
        await saveTasksToServer();
        taskForm.reset();
        showPage(activePage); // Refresh current view
        showNotification('Task added successfully');
    } catch (error) {
        showNotification('Failed to save task', 'error');
    }
}

async function handleCompleteTask(taskId) {
    const taskIndex = allTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        allTasks[taskIndex].status = 'completed';
        allTasks[taskIndex].updatedAt = new Date().toISOString();

        try {
            await saveTasksToServer();
            showPage(activePage); // Refresh current view
            showNotification('Task completed');
        } catch (error) {
            showNotification('Failed to update task', 'error');
        }
    }
}

async function handleReopenTask(taskId) {
    const taskIndex = allTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        allTasks[taskIndex].status = 'pending';
        allTasks[taskIndex].updatedAt = new Date().toISOString();

        try {
            await saveTasksToServer();
            showPage(activePage); // Refresh current view
            showNotification('Task reopened');
        } catch (error) {
            showNotification('Failed to update task', 'error');
        }
    }
}

async function handleReassignTask(taskId, newAssignee) {
    if (!newAssignee) return;

    // Check if user exists
    let userExists = allUsers.some(user => user.username === newAssignee);

    if (!userExists) {
        // Create new user
        const newUser = {
            username: newAssignee,
            displayName: newAssignee.charAt(0).toUpperCase() + newAssignee.slice(1)
        };
        allUsers.push(newUser);
        
        try {
            await saveUsersToServer();
        } catch (error) {
            showNotification('Failed to create user', 'error');
            return;
        }
    }

    // Update task
    const taskIndex = allTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        allTasks[taskIndex].assignee = newAssignee;
        allTasks[taskIndex].updatedAt = new Date().toISOString();

        try {
            await saveTasksToServer();
            showPage(activePage); // Refresh current view
            showNotification(`Task reassigned to ${newAssignee}`);
        } catch (error) {
            showNotification('Failed to reassign task', 'error');
        }
    }
}

async function handleDeleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const taskIndex = allTasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            allTasks.splice(taskIndex, 1);

            try {
                await saveTasksToServer();
                showPage(activePage); // Refresh current view
                showNotification('Task deleted');
            } catch (error) {
                showNotification('Failed to delete task', 'error');
            }
        }
    }
}

async function init() {
    try {
        // Load data
        await Promise.all([loadUsersFromServer(), loadTasksFromServer()]);
        
        // Set up event listeners
        document.querySelector('#login-form form').addEventListener('submit', handleLogin);
        taskForm.addEventListener('submit', handleAddTask);
        myTasksNav.addEventListener('click', () => showPage('my-tasks'));
        allTasksNav.addEventListener('click', () => showPage('all-tasks'));
        filterTasksNav.addEventListener('click', () => showPage('filter-tasks'));
        categoryFilter.addEventListener('submit', handleCategoryFilter);
        logoutButton.addEventListener('click', handleLogout);
        
        // Check for logged in user
        await checkLoggedInUser();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize application', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);