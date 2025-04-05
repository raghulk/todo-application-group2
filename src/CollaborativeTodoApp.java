import java.util.*;

public class CollaborativeTodoApp {
    public static void main(String[] args) {
        TaskManager manager = new TaskManager();
        try (Scanner scanner = new Scanner(System.in)) {
            System.out.println("Collaborative To-Do List Application");
            System.out.print("Enter your username: ");
            String username = scanner.nextLine();

            while (true) {
                System.out.println("\nMenu:");
                System.out.println("1. Add Task");
                System.out.println("2. Remove Task");
                System.out.println("3. Mark Task as Completed");
                System.out.println("4. View My Tasks");
                System.out.println("5. Filter Tasks by Category");
                System.out.println("6. Simulate Concurrency");
                System.out.println("7. Exit");
                System.out.print("Choose an option: ");

                int option = Integer.parseInt(scanner.nextLine());

                switch (option) {
                    case 1:
                        System.out.print("Task Description: ");
                        String desc = scanner.nextLine();
                        System.out.print("Category: ");
                        String category = scanner.nextLine();
                        manager.addTask(desc, category, username);
                        //TODO: add feedback
                        break;
                    case 2:
                        List<Task> allTasks = manager.getAllTasks();
                        if (allTasks.isEmpty()) {
                            System.out.println("No tasks available to remove.");
                        } else {
                            allTasks.forEach(System.out::println);
                            System.out.print("Enter Task ID to remove: ");
                            int removeId = Integer.parseInt(scanner.nextLine());
                            manager.removeTask(removeId);
                            // TODO: add feedback
                        }
                        break;
                    case 3:
                        List<Task> incompleteTasks = manager.getIncompleteTasks();
                        if (incompleteTasks.isEmpty()) {
                            System.out.println("No incomplete tasks available to mark as complete.");
                        } else {
                            // TODO: show only current user tasks to mark as complete
                            incompleteTasks.forEach(System.out::println);
                            System.out.print("Enter Task ID to mark as complete: ");
                            int completeId = Integer.parseInt(scanner.nextLine());
                            manager.markTaskCompleted(completeId);
                            //TODO: add feedback
                        }
                        break;

                    case 4:
                        List<Task> userTasks = manager.getUserTasks(username);
                        if (userTasks.isEmpty()) {
                            System.out.println("No tasks available to show");
                        } else {
                            userTasks.forEach(System.out::println);
                        }
                        break;
                    case 5:
                        System.out.print("Enter category to filter: ");
                        String cat = scanner.nextLine();
                        List<Task> filtered = manager.filterTasksByCategory(cat);
                        filtered.forEach(System.out::println);
                        break;
                    case 6:
                        Thread t1 = new Thread(new UserSession("Rachna", manager));
                        Thread t2 = new Thread(new UserSession("Roshan", manager));
                        t1.start();
                        t2.start();
                        break;
                    case 7:
                        System.out.println("Exiting...");
                        return;
                    default:
                        System.out.println("Invalid option. Try again.");
                }
            }
        } catch (NumberFormatException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}
