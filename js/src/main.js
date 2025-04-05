let currentUser = null;
let allUsers = []; // Will be loaded from localStorage with json export option
let allTasks = []; // Will be loaded from localStorage with json export option
let activePage = 'my-tasks';

// DOM Elements
const loginForm = document.getElementById('login-form');
const taskApp = document.getElementById('task-app');
const taskForm = document.getElementById('task-form');
const userTasksList = document.getElementById('user-tasks-list');
const allTasksList = document.getElementById('all-tasks-list');
const categoryTasksList = document.getElementById('category-tasks-list');
const taskSummary = document.getElementById('task-summary');
const categoryFilter = document.getElementById('category-filter');
const categoryNameDisplay = document.getElementById('category-name-display');
const logoutButton = document.getElementById('logout-button');

// Navigation elements
const myTasksNav = document.getElementById('my-tasks-nav');
const allTasksNav = document.getElementById('all-tasks-nav');
const filterTasksNav = document.getElementById('filter-tasks-nav');

const userTasksSection = document.getElementById('user-tasks');
const allTasksSection = document.getElementById('all-tasks');
const categoryTasksSection = document.getElementById('category-tasks');

const taskModal = document.getElementById('task-modal');
const closeModal = document.getElementById('close-modal');
const reassignForm = document.getElementById('reassign-form');
const reassignTaskDescription = document.getElementById('reassign-task-description');
const reassignTaskId = document.getElementById('reassign-task-id');

const UPDATE_INTERVAL = 3000;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log('Initializing application...');

    try {
        // Load data from localStorage first
        await Promise.all([
            loadUsersFromStorage(),
            loadTasksFromStorage()
        ]);

        // Then set up event listeners
        setupEventListeners();

        await checkLoggedInUser();

        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('There was an error initializing the application', 'error');
    }
}

function setupEventListeners() {
    document.querySelector('#login-form form').addEventListener('submit', handleLogin);

    taskForm.addEventListener('submit', handleAddTask);

    // Navigation clicks
    myTasksNav.addEventListener('click', () => showPage('my-tasks'));
    allTasksNav.addEventListener('click', () => showPage('all-tasks'));
    filterTasksNav.addEventListener('click', () => showPage('filter-tasks'));

    categoryFilter.addEventListener('submit', handleCategoryFilter);

    closeModal.addEventListener('click', () => taskModal.classList.add('hidden'));
    reassignForm.addEventListener('submit', handleReassignTask);

    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.classList.add('hidden');
        }
    });

    logoutButton.addEventListener('click', handleLogout);
}

// Data handling with localStorage
async function loadUsersFromStorage() {
    return new Promise((resolve) => {
        const usersData = localStorage.getItem('users');
        if (usersData) {
            try {
                allUsers = JSON.parse(usersData);
                if (!Array.isArray(allUsers)) {
                    console.error('Loaded users is not an array, resetting to empty array');
                    allUsers = [];
                }
                console.log('Loaded users from localStorage:', allUsers);
            } catch (error) {
                console.error('Error parsing users data:', error);
                allUsers = [];
            }
        } else {
            allUsers = [];
            console.log('No users found in localStorage, initialized with empty array');
        }
        resolve();
    });
}

async function loadTasksFromStorage() {
    return new Promise((resolve) => {
        const tasksData = localStorage.getItem('tasks');
        if (tasksData) {
            try {
                allTasks = JSON.parse(tasksData);
                if (!Array.isArray(allTasks)) {
                    console.error('Loaded tasks is not an array, resetting to empty array');
                    allTasks = [];
                }
                console.log('Loaded tasks from localStorage:', allTasks);
            } catch (error) {
                console.error('Error parsing tasks data:', error);
                allTasks = [];
            }
        } else {
            allTasks = [];
            console.log('No tasks found in localStorage, initialized with empty array');
        }
        resolve();
    });
}

async function saveUsersToStorage() {
    return new Promise((resolve, reject) => {
        try {
            const dataToSave = Array.isArray(allUsers) ? allUsers : [];
            localStorage.setItem('users', JSON.stringify(dataToSave));
            console.log('Users saved to localStorage:', dataToSave);

            if (collaborationChannel) {
                collaborationChannel.postMessage({type: 'USER_ADDED'});
            }

            resolve(true);
        } catch (error) {
            console.error('Error saving users data:', error);
            reject(error);
        }
    });
}

async function saveTasksToStorage() {
    return new Promise((resolve, reject) => {
        try {
            const dataToSave = Array.isArray(allTasks) ? allTasks : [];
            localStorage.setItem('tasks', JSON.stringify(dataToSave));
            console.log('Tasks saved to localStorage:', dataToSave);

            if (collaborationChannel) {
                collaborationChannel.postMessage({type: 'TASK_UPDATED'});
            }

            resolve(true);
        } catch (error) {
            console.error('Error saving tasks data:', error);
            reject(error);
        }
    });
}

async function checkLoggedInUser() {
    const loggedInUserData = localStorage.getItem('currentUser');
    console.log('Checking for logged in user, found data:', loggedInUserData);

    if (loggedInUserData) {
        try {
            const userData = JSON.parse(loggedInUserData);
            console.log('Parsed user data:', userData);

            const user = allUsers.find(u => u.username === userData.username);
            console.log('User found in allUsers:', user);

            if (user) {
                await loginUser(user);
                console.log('User automatically logged in');
                return true;
            } else {
                console.error('User not found in users array, clearing stored data');
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error('Error parsing logged in user data:', error);
            localStorage.removeItem('currentUser');
        }
    } else {
        console.log('No logged in user found');
    }
    return false;
}

async function handleLogout(e) {
    if (e) e.preventDefault();

    console.log('Logging out user:', currentUser);

    currentUser = null;

    // Remove from localStorage
    localStorage.removeItem('currentUser');
    console.log('Removed user data from localStorage');

    loginForm.classList.remove('hidden');
    taskApp.classList.add('hidden');

    if (collaborationChannel) {
        collaborationChannel.postMessage({type: 'USER_LOGGED_OUT'});
        console.log('Broadcast logout event');
    }

    showNotification('You have been logged out', 'success');
}

function exportUsersToJSON() {
    const jsonData = JSON.stringify(allUsers, null, 2);
    downloadJSONFile('users.json', jsonData);
    showNotification('Users exported to JSON file', 'success');
}

function exportTasksToJSON() {
    const jsonData = JSON.stringify(allTasks, null, 2);
    downloadJSONFile('tasks.json', jsonData);
    showNotification('Tasks exported to JSON file', 'success');
}

async function importUsersFromJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
        try {
            const importedUsers = JSON.parse(event.target.result);
            if (Array.isArray(importedUsers)) {
                allUsers = importedUsers;
                await saveUsersToStorage();
                showNotification('Users imported successfully', 'success');
                e.target.value = '';
            } else {
                showNotification('Invalid users data format', 'error');
            }
        } catch (error) {
            console.error('Error importing users:', error);
            showNotification('Error importing users: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

async function importTasksFromJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks)) {
                allTasks = importedTasks;
                await saveTasksToStorage();
                refreshCurrentView();
                showNotification('Tasks imported successfully', 'success');
                e.target.value = '';
            } else {
                showNotification('Invalid tasks data format', 'error');
            }
        } catch (error) {
            console.error('Error importing tasks:', error);
            showNotification('Error importing tasks: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function downloadJSONFile(filename, data) {
    const blob = new Blob([data], {type: 'application/json'});

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);

    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);

    return true;
}

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
        const newUser = {
            username,
            displayName: username.charAt(0).toUpperCase() + username.slice(1) // Simple capitalization
        };
        allUsers.push(newUser);

        try {
            await saveUsersToStorage();
            await loginUser(newUser);
        } catch (error) {
            showNotification('Failed to create user', 'error');
        }
    }
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

    // Save the updated tasks array
    try {
        await saveTasksToStorage();

        taskForm.reset();

        refreshCurrentView();

        showNotification('Task added successfully', 'success');
    } catch (error) {
        showNotification('Failed to save task', 'error');
    }
}

async function handleCompleteTask(taskId) {
    const taskIndex = allTasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        allTasks[taskIndex].status = 'completed';
        allTasks[taskIndex].updatedAt = new Date().toISOString();

        // Save the updated tasks array
        try {
            await saveTasksToStorage();

            refreshCurrentView();

            showNotification('Task marked as completed', 'success');
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

        // Save the updated tasks array
        try {
            await saveTasksToStorage();

            refreshCurrentView();

            showNotification('Task reopened', 'success');
        } catch (error) {
            showNotification('Failed to update task', 'error');
        }
    }
}

async function handleDeleteTask(taskId) {
    const taskIndex = allTasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        if (confirm('Are you sure you want to delete this task?')) {
            allTasks.splice(taskIndex, 1);

            // Save the updated tasks array
            try {
                await saveTasksToStorage();

                refreshCurrentView();

                showNotification('Task deleted', 'success');
            } catch (error) {
                showNotification('Failed to delete task', 'error');
            }
        }
    }
}

function handleOpenReassignModal(taskId) {
    const task = allTasks.find(task => task.id === taskId);

    if (task) {
        reassignTaskDescription.textContent = task.description;
        reassignTaskId.value = task.id;

        taskModal.classList.remove('hidden');
    }
}

async function handleReassignTask(e) {
    e.preventDefault();

    const taskId = parseInt(reassignTaskId.value);
    const newAssignee = document.getElementById('reassign-username').value.trim();

    if (!newAssignee) {
        showNotification('Please enter a username', 'error');
        return;
    }

    const userExists = allUsers.some(user => user.username === newAssignee);

    if (!userExists) {
        const newUser = {
            username: newAssignee,
            displayName: newAssignee.charAt(0).toUpperCase() + newAssignee.slice(1)
        };
        allUsers.push(newUser);

        try {
            await saveUsersToStorage();
        } catch (error) {
            showNotification('Failed to create user', 'error');
            return;
        }
    }

    const taskIndex = allTasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        allTasks[taskIndex].assignee = newAssignee;
        allTasks[taskIndex].updatedAt = new Date().toISOString();

        // Save the updated tasks array
        try {
            await saveTasksToStorage();

            taskModal.classList.add('hidden');

            reassignForm.reset();

            refreshCurrentView();

            showNotification(`Task reassigned to ${newAssignee}`, 'success');
        } catch (error) {
            showNotification('Failed to reassign task', 'error');
        }
    }
}

function handleCategoryFilter(e) {
    e.preventDefault();

    const categoryName = document.getElementById('category-name').value.trim();

    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }

    categoryNameDisplay.textContent = categoryName;

    // Filter tasks by the selected category
    const categoryTasks = allTasks.filter(task =>
        task.category.toLowerCase() === categoryName.toLowerCase()
    );

    // Render the filtered tasks
    renderTaskList(categoryTasksList, categoryTasks);
}

function showPage(page) {
    activePage = page;

    userTasksSection.classList.add('hidden');
    allTasksSection.classList.add('hidden');
    categoryTasksSection.classList.add('hidden');

    myTasksNav.classList.remove('active');
    allTasksNav.classList.remove('active');
    filterTasksNav.classList.remove('active');

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
    }
}

function refreshCurrentView() {
    showPage(activePage);
}

function renderUserTasks() {
    // Make sure allTasks is an array before filtering
    if (!Array.isArray(allTasks)) {
        console.error('allTasks is not an array:', allTasks);
        allTasks = [];
    }

    // Filter tasks assigned to the current user
    const userTasks = allTasks.filter(task => task.assignee === currentUser.username);

    // Render the tasks
    renderTaskList(userTasksList, userTasks);

    // Update task summary
    const completedCount = userTasks.filter(task => task.status === 'completed').length;
    const pendingCount = userTasks.filter(task => task.status === 'pending').length;
    taskSummary.textContent = `${completedCount} completed, ${pendingCount} pending`;
}

function renderAllTasks() {
    if (!Array.isArray(allTasks)) {
        console.error('allTasks is not an array:', allTasks);
        allTasks = [];
    }

    // Render all tasks
    renderTaskList(allTasksList, allTasks);
}

function renderTaskList(container, tasks) {
    container.innerHTML = '';

    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
        console.error('tasks is not an array:', tasks);
        container.innerHTML = '<div class="empty-message">Error: Tasks data is invalid</div>';
        return;
    }

    // Check if there are any tasks
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-message">No tasks found</div>';
        return;
    }

    // Sort tasks: pending first, then by creation date (newest first)
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === 'pending' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'pending') return 1;

        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
    taskItem.dataset.id = task.id;

    const creator = allUsers.find(user => user.username === task.createdBy);
    const assignee = allUsers.find(user => user.username === task.assignee);

    const createdDate = new Date(task.createdAt);
    const updatedDate = new Date(task.updatedAt);

    taskItem.innerHTML = `
        <div class="task-header">
            <span class="task-id">#${task.id}</span>
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
            <span>Updated: ${formatDate(updatedDate)}</span>
        </div>
        <div class="task-actions">
            ${task.status === 'pending'
        ? `<button class="btn btn-success complete-task">Complete</button>`
        : `<button class="btn btn-secondary reopen-task">Reopen</button>`}
            <button class="btn btn-primary reassign-task">Reassign</button>
            <button class="btn btn-danger delete-task">Delete</button>
        </div>
    `;

    // Add event listeners to the buttons
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
        reassignButton.addEventListener('click', () => handleOpenReassignModal(task.id));
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', () => handleDeleteTask(task.id));
    }

    return taskItem;
}

async function loginUser(user) {
    currentUser = user;

    // Save current user to localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(user));

    loginForm.classList.add('hidden');
    taskApp.classList.remove('hidden');

    // Show the user tasks by default
    showPage('my-tasks');

    startRealTimeUpdates();
}

function getNextTaskId() {
    const maxId = allTasks.reduce((max, task) => (task.id > max ? task.id : max), 0);
    return maxId + 1;
}

function formatDate(date) {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    if (isToday) {
        return `Today at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        return `Yesterday at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Real-time updates (polling localStorage for changes)
function startRealTimeUpdates() {
    setInterval(() => {
        checkForUpdates();
    }, UPDATE_INTERVAL);
}

async function checkForUpdates() {
    // Get the latest data from localStorage
    const storedTasksData = localStorage.getItem('tasks');
    const storedUsersData = localStorage.getItem('users');

    if (storedTasksData) {
        try {
            const updatedTasks = JSON.parse(storedTasksData);

            if (!Array.isArray(updatedTasks)) {
                console.warn('Retrieved tasks data is not an array:', updatedTasks);
                return;
            }

            // Check if there are any changes in tasks
            if (JSON.stringify(updatedTasks) !== JSON.stringify(allTasks)) {
                console.log('Tasks updated from localStorage');

                // Update the local tasks array
                allTasks = updatedTasks;

                refreshCurrentView();
            }
        } catch (error) {
            console.error('Error parsing tasks data:', error);
        }
    }

    if (storedUsersData) {
        try {
            const updatedUsers = JSON.parse(storedUsersData);

            if (!Array.isArray(updatedUsers)) {
                console.warn('Retrieved users data is not an array:', updatedUsers);
                return;
            }

            if (JSON.stringify(updatedUsers) !== JSON.stringify(allUsers)) {
                console.log('Users updated from localStorage');

                allUsers = updatedUsers;
            }
        } catch (error) {
            console.error('Error parsing users data:', error);
        }
    }
}

function setupCollaborationSupport() {
    try {
        console.log("Setting up collaboration channel...");

        const collaborationChannel = new BroadcastChannel('todo-collaboration');

        collaborationChannel.onmessage = (event) => {
            console.log("Received collaboration message:", event.data);

            if (!event.data || typeof event.data !== 'object') {
                console.error("Invalid message format:", event.data);
                return;
            }

            const {type, data} = event.data;

            switch (type) {
                case 'TASK_ADDED':
                case 'TASK_UPDATED':
                case 'TASK_DELETED':
                case 'USER_ADDED':
                case 'USER_LOGGED_OUT':
                    console.log(`Processing ${type} event`);

                    // Reload data from localStorage
                    loadUsersFromStorage();
                    loadTasksFromStorage();

                    refreshCurrentView();

                    if (type === 'TASK_ADDED' && data && data.assignee === currentUser?.username) {
                        showNotification('A new task has been assigned to you', 'success');
                    }
                    break;
                default:
                    console.log(`Unknown event type: ${type}`);
                    break;
            }
        };

        console.log("Collaboration channel set up successfully");

        return collaborationChannel;
    } catch (error) {
        console.error("Error setting up collaboration channel:", error);
        throw error;
    }
}

let collaborationChannel;
try {
    collaborationChannel = setupCollaborationSupport();
} catch (error) {
    console.error('Error setting up collaboration support:', error);
    collaborationChannel = {
        postMessage: () => {
        }
    };
}

function broadcastTaskChange(type, data = null) {
    if (collaborationChannel) {
        collaborationChannel.postMessage({type, data});
    }
}