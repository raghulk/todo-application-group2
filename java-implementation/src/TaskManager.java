import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

public class TaskManager {
    private List<Task> tasks;
    private int taskCounter = 1;
    private final String FILE_PATH = "tasks.ser";

    public TaskManager() {
        this.tasks = loadTasks();
        if (!tasks.isEmpty()) {
            taskCounter = tasks.get(tasks.size() - 1).id + 1;
        }
    }

    public synchronized void addTask(String description, String category, String assignedUser) {
        Task task = new Task(taskCounter++, description, category, assignedUser);
        tasks.add(task);
        saveTasks();
    }

    public synchronized void removeTask(int id) {
        tasks.removeIf(task -> task.id == id);
        saveTasks();
    }

    public synchronized void markTaskCompleted(int id) {
        for (Task task : tasks) {
            if (task.id == id) {
                task.markCompleted();
                break;
            }
        }
        saveTasks();
    }

    public synchronized List<Task> getUserTasks(String username) {
        List<Task> result = new ArrayList<>();
        for (Task task : tasks) {
            if (task.assignedUser.equals(username)) {
                result.add(task);
            }
        }
        return result;
    }

    public synchronized List<Task> filterTasksByCategory(String category) {
        List<Task> result = new ArrayList<>();
        for (Task task : tasks) {
            if (task.category.equalsIgnoreCase(category)) {
                result.add(task);
            }
        }
        return result;
    }

    private void saveTasks() {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(FILE_PATH))) {
            oos.writeObject(tasks);
        } catch (IOException e) {
            System.out.println("Error saving tasks: " + e.getMessage());
        }
    }

    private List<Task> loadTasks() {
        File file = new File(FILE_PATH);
        if (!file.exists()) return new ArrayList<>();
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(FILE_PATH))) {
            return (List<Task>) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            System.out.println("Error loading tasks: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public synchronized List<Task> getAllTasks() {
        return new ArrayList<>(tasks);
    }
    
    public synchronized List<Task> getIncompleteTasks() {
        return tasks.stream()
                    .filter(task -> "Pending".equalsIgnoreCase(task.getStatus()))
                    .collect(Collectors.toList());
    }
    
}