import java.util.List;

public class UserSession implements Runnable {
    private String username;
    private TaskManager manager;

    public UserSession(String username, TaskManager manager) {
        this.username = username;
        this.manager = manager;
    }

    @Override
    public void run() {
        manager.addTask("Auto-generated task by " + username, "Auto", username);
        manager.markTaskCompleted(1); // Optional: simulate completing task 1
        List<Task> tasks = manager.getUserTasks(username);
        System.out.println("[" + username + "] Task List:");
        for (Task task : tasks) {
            System.out.println(task);
        }
    }
}