import java.util.Scanner;
import java.util.function.Predicate;

public class ConsoleUtils {
    private static final String ANSI_RESET = "\u001B[0m";
    private static final String ANSI_RED = "\u001B[31m";
    private static final String ANSI_GREEN = "\u001B[32m";
    private static final String ANSI_YELLOW = "\u001B[33m";
    private static final String ANSI_BLUE = "\u001B[34m";
    private static final String ANSI_BOLD = "\u001B[1m";

    public static class Result<T> {
        private final T value;
        private final boolean success;
        private final String errorMessage;

        private Result(T value) {
            this.value = value;
            this.success = true;
            this.errorMessage = null;
        }

        private Result(String errorMessage) {
            this.value = null;
            this.success = false;
            this.errorMessage = errorMessage;
        }

        public static <T> Result<T> success(T value) {
            return new Result<>(value);
        }

        public static <T> Result<T> error(String errorMessage) {
            return new Result<>(errorMessage);
        }

        public boolean isSuccess() {
            return success;
        }

        public T getValue() {
            return value;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }

    public static void printHeader(String header) {
        System.out.println(ANSI_BOLD + ANSI_BLUE + "\n==== " + header + " ====" + ANSI_RESET);
    }

    public static void printSuccessMessage(String message) {
        System.out.println(ANSI_GREEN + "✓ " + message + ANSI_RESET);
    }

    public static void printErrorMessage(String message) {
        System.out.println(ANSI_RED + "✗ " + message + ANSI_RESET);
    }

    public static void printWarningMessage(String message) {
        System.out.println(ANSI_YELLOW + "! " + message + ANSI_RESET);
    }

    public static void printInfoMessage(String message) {
        System.out.println(ANSI_BLUE + "ℹ " + message + ANSI_RESET);
    }

    public static String readInput(Scanner scanner, String prompt) {
        System.out.print(prompt);
        return scanner.nextLine().trim();
    }

    public static String readRequiredInput(Scanner scanner, String prompt) {
        while (true) {
            String input = readInput(scanner, prompt);
            if (!input.isEmpty()) {
                return input;
            }
            printErrorMessage("Input cannot be empty. Please try again.");
        }
    }

    public static <T> Result<T> readValidInput(Scanner scanner, String prompt,
                                               Predicate<String> validator,
                                               String errorMessage,
                                               java.util.function.Function<String, T> converter) {
        while (true) {
            try {
                String input = readInput(scanner, prompt);

                if (input.isEmpty()) {
                    return Result.error("Input cannot be empty");
                }

                if (!validator.test(input)) {
                    printErrorMessage(errorMessage);
                    continue;
                }

                T converted = converter.apply(input);
                return Result.success(converted);
            } catch (Exception e) {
                printErrorMessage("Invalid input: " + e.getMessage());
            }
        }
    }

    public static Result<Integer> readInteger(Scanner scanner, String prompt) {
        return readValidInput(
                scanner,
                prompt,
                input -> input.matches("\\d+"),
                "Please enter a valid number",
                Integer::parseInt
        );
    }

    public static Result<Integer> readIntegerInRange(Scanner scanner, String prompt,
                                                     int min, int max) {
        return readValidInput(
                scanner,
                prompt,
                input -> {
                    try {
                        int value = Integer.parseInt(input);
                        return value >= min && value <= max;
                    } catch (NumberFormatException e) {
                        return false;
                    }
                },
                "Please enter a number between " + min + " and " + max,
                Integer::parseInt
        );
    }

    public static void promptEnterToContinue(Scanner scanner) {
        System.out.println(ANSI_BLUE + "\nPress Enter to continue..." + ANSI_RESET);
        scanner.nextLine();
    }
}