import java.util.List;

public class UserSession implements Runnable {
    private final String username;
    private final TaskManager manager;
    private final CountDownLatch latch;
    private final boolean simulateTask;

    public UserSession(String username, TaskManager manager) {
        this(username, manager, null, true);
    }

    public UserSession(String username, TaskManager manager, CountDownLatch latch, boolean simulateTask) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be null or empty");
        }

        this.username = username;
        this.manager = manager;
        this.latch = latch;
        this.simulateTask = simulateTask;
    }

    @Override
    public void run() {
        try {
            if (simulateTask) {
                // Create a task for demonstration
                boolean taskAdded = manager.addTask("Auto-generated task by " + username,
                        "Simulation",
                        username);

                if (!taskAdded) {
                    System.err.println("[" + username + "] Error: Failed to add task");
                }
            }

            // Get all tasks assigned to this user
            List<Task> tasks = manager.getUserTasks(username);

            System.out.println("\n[" + username + "] Task List (" + tasks.size() + " tasks):");
            if (tasks.isEmpty()) {
                System.out.println("[" + username + "] No tasks assigned");
            } else {
                for (Task task : tasks) {
                    System.out.println("[" + username + "] " + task);
                }
            }

            // Mark a task as completed if there's at least one incomplete task
            List<Task> incompleteTasks = manager.getIncompleteTasksByUser(username);
            if (!incompleteTasks.isEmpty()) {
                Task firstTask = incompleteTasks.get(0);
                boolean marked = manager.markTaskCompleted(firstTask.getId(), username);

                if (marked) {
                    System.out.println("[" + username + "] Marked task #" + firstTask.getId() + " as completed");
                } else {
                    System.out.println("[" + username + "] Failed to mark task #" + firstTask.getId() + " as completed");
                }
            }
        } catch (Exception e) {
            System.err.println("[" + username + "] Error in session: " + e.getMessage());
        } finally {
            if (latch != null) {
                latch.countDown();
            }
        }
    }
}