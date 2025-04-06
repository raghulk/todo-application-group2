import java.io.*;
import java.util.*;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;

public class TaskManager {
    private List<Task> tasks;
    private Map<String, User> users;
    private int taskCounter = 1;
    private final String TASKS_FILE_PATH = "java-implementation/src/data/tasks.ser";
    private final String USERS_FILE_PATH = "java-implementation/src/data/users.ser";
    private final ReadWriteLock lock = new ReentrantReadWriteLock();

    public TaskManager() {
        this.tasks = loadTasks();
        this.users = loadUsers();
        
        if (!tasks.isEmpty()) {
            // Find the highest task ID to ensure new IDs don't conflict
            Optional<Integer> maxId = tasks.stream()
                    .map(Task::getId)
                    .max(Integer::compareTo);
            
            taskCounter = maxId.orElse(0) + 1;
        }
    }

    public User getOrCreateUser(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be null or empty");
        }

        lock.readLock().lock();
        try {
            User user = users.get(username);
            
            if (user == null) {
                lock.readLock().unlock();
                lock.writeLock().lock();
                
                try {
                    // Double-check in case another thread created the user
                    user = users.get(username);
                    if (user == null) {
                        user = new User(username);
                        users.put(username, user);
                        saveUsers();
                    }
                    return user;
                } finally {
                    lock.writeLock().unlock();
                    lock.readLock().lock();
                }
            }
            
            return user;
        } finally {
            lock.readLock().unlock();
        }
    }

    public boolean addTask(String description, String category, String assignedUser) {
        if (description == null || description.trim().isEmpty()) {
            return false;
        }
        
        if (category == null || category.trim().isEmpty()) {
            category = "General";
        }
        
        User user = getOrCreateUser(assignedUser);
        
        lock.writeLock().lock();
        try {
            Task task = new Task(taskCounter++, description, category, user.getUsername());
            tasks.add(task);
            saveTasks();
            return true;
        } catch (Exception e) {
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean removeTask(int id) {
        lock.writeLock().lock();
        try {
            boolean removed = tasks.removeIf(task -> task.getId() == id);
            if (removed) {
                saveTasks();
            }
            return removed;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean markTaskCompleted(int id, String username) {
        lock.writeLock().lock();
        try {
            Optional<Task> taskOpt = tasks.stream()
                    .filter(task -> task.getId() == id)
                    .findFirst();
            
            if (taskOpt.isPresent()) {
                Task task = taskOpt.get();
                
                // Check if the user is allowed to mark this task as completed
                if (!task.getAssignedUser().equalsIgnoreCase(username)) {
                    return false;
                }
                
                if (task.getStatus() == Task.TaskStatus.COMPLETED) {
                    return false; // Already completed
                }
                
                task.markCompleted();
                saveTasks();
                return true;
            }
            
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }
    
    public boolean reassignTask(int id, String fromUsername, String toUsername) {
        if (toUsername == null || toUsername.trim().isEmpty()) {
            return false;
        }
        
        // First, ensure the target user exists (or create it)
        User targetUser = getOrCreateUser(toUsername);
        
        lock.writeLock().lock();
        try {
            // Find the task by ID
            Optional<Task> taskOpt = tasks.stream()
                    .filter(task -> task.getId() == id)
                    .findFirst();
            
            if (!taskOpt.isPresent()) {
                return false; // Task doesn't exist
            }
            
            Task task = taskOpt.get();
            
            // Verify that the current user owns this task
            if (fromUsername != null && !task.getAssignedUser().equalsIgnoreCase(fromUsername)) {
                return false; // Not authorized to reassign this task
            }
            
            // Perform the reassignment
            task.setAssignedUser(targetUser.getUsername());
            
            // Save changes
            saveTasks();
            return true;
        } catch (Exception e) {
            System.err.println("Error reassigning task: " + e.getMessage());
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<Task> getUserTasks(String username) {
        if (username == null || username.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        lock.readLock().lock();
        try {
            return tasks.stream()
                    .filter(task -> task.getAssignedUser().equalsIgnoreCase(username))
                    .collect(Collectors.toList());
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Task> filterTasksByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        lock.readLock().lock();
        try {
            return tasks.stream()
                    .filter(task -> task.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        } finally {
            lock.readLock().unlock();
        }
    }

    public Set<String> getAllCategoriesFromTasks() {
        lock.readLock().lock();
        try {
            return tasks.stream()
                    .map(Task::getCategory)
                    .collect(Collectors.toSet());
        } finally {
            lock.readLock().unlock();
        }
    }

    public List<Task> getTasksByStatus(Task.TaskStatus status) {
        lock.readLock().lock();
        try {
            return tasks.stream()
                    .filter(task -> task.getStatus() == status)
                    .collect(Collectors.toList());
        } finally {
            lock.readLock().unlock();
        }
    }

    private void saveTasks() {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(TASKS_FILE_PATH))) {
            oos.writeObject(tasks);
        } catch (IOException e) {
            System.err.println("Error saving tasks: " + e.getMessage());
        }
    }

    private List<Task> loadTasks() {
        File file = new File(TASKS_FILE_PATH);
        if (!file.exists()) {
            return new ArrayList<>();
        }
        
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(TASKS_FILE_PATH))) {
            return (List<Task>) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("Error loading tasks: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    private void saveUsers() {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(USERS_FILE_PATH))) {
            oos.writeObject(users);
        } catch (IOException e) {
            System.err.println("Error saving users: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, User> loadUsers() {
        File file = new File(USERS_FILE_PATH);
        if (!file.exists()) {
            return new HashMap<>();
        }
        
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(USERS_FILE_PATH))) {
            return (Map<String, User>) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            System.err.println("Error loading users: " + e.getMessage());
            return new HashMap<>();
        }
    }

    public List<Task> getAllTasks() {
        lock.readLock().lock();
        try {
            return new ArrayList<>(tasks);
        } finally {
            lock.readLock().unlock();
        }
    }
    
    public List<Task> getIncompleteTasks() {
        lock.readLock().lock();
        try {
            return tasks.stream()
                    .filter(task -> task.getStatus() == Task.TaskStatus.PENDING)
                    .collect(Collectors.toList());
        } finally {
            lock.readLock().unlock();
        }
    }
    
    public Optional<Task> getTaskById(int id) {
        lock.readLock().lock();
        try {
            return tasks.stream()
                    .filter(task -> task.getId() == id)
                    .findFirst();
        } finally {
            lock.readLock().unlock();
        }
    }
    
    public List<Task> getIncompleteTasksByUser(String username) {
        if (username == null || username.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        lock.readLock().lock();
        try {
            return tasks.stream()
                    .filter(task -> task.getAssignedUser().equalsIgnoreCase(username) &&
                                   task.getStatus() == Task.TaskStatus.PENDING)
                    .collect(Collectors.toList());
        } finally {
            lock.readLock().unlock();
        }
    }
}