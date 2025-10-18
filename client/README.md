# LiquidJava - Extending Java with Liquid Types

![](https://raw.githubusercontent.com/CatarinaGamboa/liquidjava/refs/heads/main/docs/design/figs/banner.gif)

### Extend your Java code with Liquid Types and catch bugs earlier!

LiquidJava is an additional type checker for Java, based on **liquid types** and **typestates**, which provides stronger safety guarantees to Java programs at compile-time. With this extension, you can use LiquidJava directly in VS Code, with real-time error diagnostics, syntax highlighting for refinements and more!

```java
@Refinement("a > 0")
int a = 3; // okay
a = -8; // type error!
```

### What are Liquid Types?

Liquid types, or refinement types, extend a language with **logical predicates** over the basic types. They allow developers to restrict the values that a variable, parameter or return value can have. These kinds of constraints help to catch more bugs before the program is executed — for example array index out-of-bounds or division by zero.

### Usage

To refine a variable, parameter or return value, use the annotation `@Refinement` with a predicate as argument. The predicate must be a boolean expression that uses the name of the variable being refined (or `_`) to refer to its value. Some examples include:

```java
// x must be greater than 0
@Refinement("x > 0")
int x;

// y must be between 0 and 100
@Refinement("0 <= _ && _ <= 100")
int y;

// z must be positive if it is even and negative if it is odd
@Refinement("z % 2 == 0 ? z >= 0 : z < 0")
int z;
```

To simplify the usage of refinements, you can create **predicate aliases** using the `@RefinementAlias` annotation, and apply them inside other refinements:

```java
@RefinementAlias("Percentage(int v) { 0 <= v && v <= 100 }")
public class MyClass {

    // x must be between 0 and 100
    @Refinement("Percentage(x)")
    int x = 25;
}
```

Refinements can also be applied to method parameters and return values:

```java
@Refinement("_ >= 0")
int absDiv(int a, @Refinement("b != 0") int b) {
    int res = a / b;
    return res >= 0 ? res : -res;
}
```

Beyond basic refinements, LiquidJava also supports **object state modeling** through typestates, which allows developers to specify when a method can or cannot be called based on the state of the object. For example:

```java
@StateSet({"open", "closed"})
public class MyFile {

    @StateRefinement(to="open(this)")
    public MyFile() {}

    @StateRefinement(from="open(this)")
    public void read() {}

    @StateRefinement(from="open(this)", to="closed(this)")
    public void close() {}
}

MyFile f = new MyFile(); // state(f) == "open"
f.read();  // state(f) == "open" (unchanged)
f.close(); // state(f) == "closed"
f.read();  // type error!
```

Finally, LiquidJava also provides **ghost variables**, which are used to track additional information about the program state when states aren't enough, with the `@Ghost` annotation. Additionally, you can also refine external libraries using the `@ExternalRefinementsFor` annotation. Here is an example of the `java.util.Stack` class refined with LiquidJava, using a `size` ghost variable to track the number of elements in the stack:

```java
@ExternalRefinementsFor("java.util.Stack")
@Ghost("int size")
public interface StackRefinements<E> {

	public void Stack();

	@StateRefinement(to="size(this) == (size(old(this)) + 1)")
	public boolean push(E elem);

	@StateRefinement(from="size(this) > 0", to="size(this) == (size(old(this)) - 1)")
	public E pop();

	@StateRefinement(from="size(this) > 0")
	public E peek();
}

Stack<Integer> s = new Stack<>(); // size(s) == 0 (default value)
s.push(10); // size(s) == 1
s.pop(); // size(s) == 0
s.pop(); // type error!

```

You can find more examples of how to use LiquidJava on the [LiquidJava Website](https://catarinagamboa.github.io/liquidjava.html). For more information, check the following repositories:
- [liquidjava](https://github.com/CatarinaGamboa/liquidjava): Main repository with API, verifier and some examples
- [vscode-liquidjava](https://github.com/CatarinaGamboa/vscode-liquidjava): Source code of this VS Code extension
- [liquidjava-examples](https://github.com/CatarinaGamboa/liquidjava-examples): Repository with more usage examples of LiquidJava
- [liquid-java-external-libs](https://github.com/CatarinaGamboa/liquid-java-external-libs): Examples of how to use LiquidJava with external libraries
