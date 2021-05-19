

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
        double a;
        a = DivideLJ.divide(10, 5);
        a = DivideLJ.divide(50, ((-10) + 5));
        // a = divide(800, 2*30-60);
        a = DivideLJ.divide((1952 * 2), (20 - 10));
        a = DivideLJ.divide(((5 * 5) * 5), ((-5) * (-1)));
        double b;
        b = DivideLJ.averagePrice(10, 5);
        b = DivideLJ.averagePrice(50, ((-10) + 15));
        b = DivideLJ.averagePrice(800, ((2 * 30) - 60));
        // b = averagePrice(1952*-2, 20-10);
        b = DivideLJ.averagePrice(((5 * 5) * 5), ((-5) * (-1)));
    }
}

