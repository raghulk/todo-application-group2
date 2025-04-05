import java.util.*;

public class CollaborativeTodoApp {
    public static void main(String[] args) {
        TaskManager manager = new TaskManager();
        Scanner scanner = new Scanner(System.in);

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

            
        }
    }
}