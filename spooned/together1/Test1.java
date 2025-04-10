package together1;
@repair.regen.specification.RefinementAlias("Nat(int x) {x >= 0}")
@repair.regen.specification.RefinementAlias("GreaterEqualThan(int x, int y) {x >= y}")
public class Test1 {
    /**
     * Computes the fibonacci of index n
     *
     * @param n
     * 		The index of the required fibonacci number (greater or equal to 0)
     * @return The fibonacci nth number. The fibonacci sequence follows the formula
    Fn = Fn-1 + Fn-2 and has the starting values of F0 = 1 and F1 = 1
     */
    /* Uncomment Below */
    // @Refinement( "_ >= 0 && GreaterEqualThan(_, n)")
    // public static int fibonacci(@Refinement("Nat(n)") int n){
    // if(n < 1)
    // return 0;
    // else
    // return fibonacci(n-1) + fibonacci(n-2);
    // }
    public static void main(java.lang.String[] args) {
        @repair.regen.specification.Refinement("Nat(n)")
        int n = -5;
        // Uncomment the following line to test the fibonacci function
        // System.out.println(fibonacci(5)); // Expected output: 5
    }
}