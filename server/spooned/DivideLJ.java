

public class DivideLJ {
    public static int divide(int numerator, @repair.regen.specification.Refinement("denominator != 0")
    int denominator) {
        return numerator / denominator;
    }

    public static void main(java.lang.String[] args) {
        int a;
        a = DivideLJ.divide(10, 5);
        a = DivideLJ.divide(50, 10);
        // a = divide(800, 0);
    }
}

