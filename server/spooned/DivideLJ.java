

public class DivideLJ {
    public static double divide(double numerator, @repair.regen.specification.Refinement("denominator != 0")
    double denominator) {
        return numerator / denominator;
    }

    public static double averagePrice(@repair.regen.specification.Refinement("price1 >= 0")
    double price1, @repair.regen.specification.Refinement("price2 >= 0")
    double price2) {
        return (price1 + price2) / 2;
    }

    public static void main(java.lang.String[] args) {
        // double a;
        // a = divide(10, 5);
        // a = divide(50, -10+5);
        // // a = divide(800, 2*30-60);
        // a = divide(1952*2, 20-10);
        // a = divide(5*5*5, -5*-1);
        // double b;
        // b = averagePrice(10, 5);
        // b = averagePrice(50, -10+15);
        // b = averagePrice(800, 2*30-60);
        // // b = averagePrice(1952*-2, 20-10);
        // b = averagePrice(5*5*5, -5*-1);
    }
}

