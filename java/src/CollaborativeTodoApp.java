import java.util.*;
import java.util.concurrent.CountDownLatch;

public class CollaborativeTodoApp {
    private static TaskManager manager;
    private static Scanner scanner;
    private static String currentUsername;

    public static void main(String[] args) {
        manager = new TaskManager();
        scanner = new Scanner(System.in);

        try {
            ConsoleUtils.printHeader("Collaborative To-Do List Application");
            login();

            while (true) {
                displayMenu();
                ConsoleUtils.Result<Integer> optionResult = ConsoleUtils.readIntegerInRange(scanner, "Choose an option: ", 1, 9);

                if (!optionResult.isSuccess()) {
                    ConsoleUtils.printErrorMessage(optionResult.getErrorMessage());
                    continue;
                }

                int option = optionResult.getValue();

                try {
                    processMenuOption(option);
                } catch (Exception e) {
                    ConsoleUtils.printErrorMessage("An error occurred: " + e.getMessage());
                    e.printStackTrace();
                }

                if (option == 9) {
                    ConsoleUtils.printInfoMessage("Exiting application. Goodbye!");
                    break;
                }

                ConsoleUtils.promptEnterToContinue(scanner);
            }
        } catch (Exception e) {
            ConsoleUtils.printErrorMessage("Fatal error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            if (scanner != null) {
                scanner.close();
            }
        }
    }

    private static void login() {
        String username = ConsoleUtils.readRequiredInput(scanner, "Enter your username: ");
        currentUsername = capitalizeString(username);
        User user = manager.getOrCreateUser(currentUsername);
        ConsoleUtils.printSuccessMessage("Welcome, " + user.getUsername() + "!");
    }

    private static String capitalizeString(String string) {
        return string.trim().substring(0,1).toUpperCase() + string.substring(1);
    }

    private static void displayMenu() {
        ConsoleUtils.printHeader("Main Menu");
        System.out.println("1. Add Task");
        System.out.println("2. Remove Task");
        System.out.println("3. Mark Task as Completed");
        System.out.println("4. View My Tasks");
        System.out.println("5. Filter Tasks by Category");
        System.out.println("6. View All Tasks");
        System.out.println("7. Reassign Task");
        System.out.println("8. Simulate Concurrent Users");
        System.out.println("9. Exit");
    }

    private static void processMenuOption(int option) {
        switch (option) {
            case 1:
                addTask();
                break;
            case 2:
                removeTask();
                break;
            case 3:
                markTaskAsCompleted();
                break;
            case 4:
                viewMyTasks();
                break;
            case 5:
                filterTasksByCategory();
                break;
            case 6:
                viewAllTasks();
                break;
            case 7:
                reassignTask();
                break;
            case 8:
                simulateConcurrentUsers();
                break;
            case 9:
                // Exit is handled in the main loop
                break;
            default:
                ConsoleUtils.printErrorMessage("Invalid option. Please try again.");
        }
    }

    private static void addTask() {
        ConsoleUtils.printHeader("Add New Task");

        String description = ConsoleUtils.readRequiredInput(scanner, "Task Description: ");
        String category = ConsoleUtils.readInput(scanner, "Category (or leave empty for 'General'): ");

        if (category.isEmpty()) {
            category = "General";
        }

        String usernameForTask = ConsoleUtils.readInput(scanner, "Username to assign task to (or leave empty for yourself): ");

        if (usernameForTask.isEmpty()) {
            usernameForTask = currentUsername;
        }
        boolean success = manager.addTask(description, category, capitalizeString(usernameForTask));

        if (success) {
            ConsoleUtils.printSuccessMessage("Task added successfully!");
        } else {
            ConsoleUtils.printErrorMessage("Failed to add task. Please try again.");
        }
    }

    private static void removeTask() {
        ConsoleUtils.printHeader("Remove Task");

        List<Task> allTasks = manager.getAllTasks();

        if (allTasks.isEmpty()) {
            ConsoleUtils.printInfoMessage("No tasks available to remove.");
            return;
        }

        displayTasks(allTasks, "All Tasks");

        ConsoleUtils.Result<Integer> idResult = ConsoleUtils.readInteger(scanner, "Enter Task ID to remove (or 0 to cancel): ");

        if (!idResult.isSuccess()) {
            ConsoleUtils.printErrorMessage(idResult.getErrorMessage());
            return;
        }

        int id = idResult.getValue();

        if (id == 0) {
            ConsoleUtils.printInfoMessage("Operation cancelled.");
            return;
        }

        boolean removed = manager.removeTask(id);

        if (removed) {
            ConsoleUtils.printSuccessMessage("Task #" + id + " removed successfully!");
        } else {
            ConsoleUtils.printErrorMessage("Failed to remove task. ID may not exist.");
        }
    }

    private static void markTaskAsCompleted() {
        ConsoleUtils.printHeader("Mark Task as Completed");

        List<Task> incompleteTasks = manager.getIncompleteTasksByUser(currentUsername);

        if (incompleteTasks.isEmpty()) {
            ConsoleUtils.printInfoMessage("You have no incomplete tasks to mark as completed.");
            return;
        }

        displayTasks(incompleteTasks, "Your Incomplete Tasks");

        ConsoleUtils.Result<Integer> idResult = ConsoleUtils.readInteger(scanner, "Enter Task ID to mark as completed (or 0 to cancel): ");

        if (!idResult.isSuccess()) {
            ConsoleUtils.printErrorMessage(idResult.getErrorMessage());
            return;
        }

        int id = idResult.getValue();

        if (id == 0) {
            ConsoleUtils.printInfoMessage("Operation cancelled.");
            return;
        }

        boolean marked = manager.markTaskCompleted(id, currentUsername);

        if (marked) {
            ConsoleUtils.printSuccessMessage("Task #" + id + " marked as completed!");
        } else {
            ConsoleUtils.printErrorMessage("Failed to mark task as completed. Task ID may not exist, task may already be completed, or you may not be assigned to this task.");
        }
    }

    private static void viewMyTasks() {
        ConsoleUtils.printHeader("My Tasks");

        List<Task> userTasks = manager.getUserTasks(currentUsername);

        if (userTasks.isEmpty()) {
            ConsoleUtils.printInfoMessage("You don't have any tasks assigned to you.");
        } else {
            displayTasks(userTasks, "Tasks Assigned to You");

            // Show summary
            long completedCount = userTasks.stream()
                    .filter(task -> task.getStatus() == Task.TaskStatus.COMPLETED)
                    .count();

            ConsoleUtils.printInfoMessage("Summary: " + completedCount + " completed, " +
                    (userTasks.size() - completedCount) + " pending");
        }
    }

    private static void filterTasksByCategory() {
        ConsoleUtils.printHeader("Filter Tasks by Category");

        displayCategories(manager.getAllCategoriesFromTasks());

        String category = ConsoleUtils.readRequiredInput(scanner, "Enter category to filter: ");

        List<Task> filteredTasks = manager.filterTasksByCategory(category);

        if (filteredTasks.isEmpty()) {
            ConsoleUtils.printInfoMessage("No tasks found in category '" + category + "'.");
        } else {
            displayTasks(filteredTasks, "Tasks in Category '" + category + "'");
        }
    }

    private static void viewAllTasks() {
        ConsoleUtils.printHeader("All Tasks");

        List<Task> allTasks = manager.getAllTasks();

        if (allTasks.isEmpty()) {
            ConsoleUtils.printInfoMessage("There are no tasks in the system.");
        } else {
            displayTasks(allTasks, "All Tasks");
        }
    }

    private static void reassignTask() {
        ConsoleUtils.printHeader("Reassign Task");

        // First show the user's own tasks
        List<Task> userTasks = manager.getUserTasks(currentUsername);

        if (userTasks.isEmpty()) {
            ConsoleUtils.printErrorMessage("You don't have any tasks assigned to you to reassign.");
            return;
        }

        // Display all tasks assigned to the current user
        ConsoleUtils.printInfoMessage("Your current tasks:");
        displayTasks(userTasks, "Tasks You Can Reassign");

        // Ask user to select a task by ID
        ConsoleUtils.Result<Integer> idResult = ConsoleUtils.readInteger(scanner,
                "Enter Task ID to reassign (or 0 to cancel): ");

        if (!idResult.isSuccess()) {
            ConsoleUtils.printErrorMessage(idResult.getErrorMessage());
            return;
        }

        int taskId = idResult.getValue();

        if (taskId == 0) {
            ConsoleUtils.printInfoMessage("Operation cancelled.");
            return;
        }

        // Verify the task exists and belongs to the current user
        Optional<Task> taskToReassign = userTasks.stream()
                .filter(task -> task.getId() == taskId)
                .findFirst();

        if (taskToReassign.isEmpty()) {
            ConsoleUtils.printErrorMessage("Task #" + taskId + " is not assigned to you or does not exist.");
            return;
        }

        // Get the new assignee username
        String newAssignee = ConsoleUtils.readRequiredInput(scanner, "Enter username to reassign to: ");

        // Attempt to reassign the task
        boolean success = manager.reassignTask(taskId, currentUsername, capitalizeString(newAssignee));

        if (success) {
            ConsoleUtils.printSuccessMessage("Task #" + taskId + " successfully reassigned to '" + newAssignee + "'");
        } else {
            ConsoleUtils.printErrorMessage("Failed to reassign task #" + taskId);
        }
    }

    private static void simulateConcurrentUsers() {
        ConsoleUtils.printHeader("Simulating Concurrent Users");

        int numberOfUsers = 3;
        CountDownLatch latch = new CountDownLatch(numberOfUsers);

        ConsoleUtils.printInfoMessage("Starting simulation with " + numberOfUsers + " concurrent users...");

        // Create and start threads for different users
        Thread t1 = new Thread(new UserSession("Alice", manager, latch, true));
        Thread t2 = new Thread(new UserSession("Bob", manager, latch, true));
        Thread t3 = new Thread(new UserSession("Charlie", manager, latch, true));

        t1.start();
        t2.start();
        t3.start();

        try {
            // Wait for all threads to complete
            latch.await();
            ConsoleUtils.printSuccessMessage("Simulation completed successfully!");
        } catch (InterruptedException e) {
            ConsoleUtils.printErrorMessage("Simulation was interrupted: " + e.getMessage());
            Thread.currentThread().interrupt();
        }
    }

    private static void displayTasks(List<Task> tasks, String title) {
        ConsoleUtils.printHeader(title + " (" + tasks.size() + " tasks)");

        for (Task task : tasks) {
            String statusColor = task.getStatus() == Task.TaskStatus.COMPLETED ?
                    "\u001B[32m" : "\u001B[33m"; // Green for completed, Yellow for pending

            System.out.println(statusColor + task + "\u001B[0m");
        }
    }

    private static void displayCategories(Set<String> categories) {
        ConsoleUtils.printHeader("Categories to choose from:" + " (" + categories.size() + " categories)");

        categories.forEach(System.out::println);
    }
}