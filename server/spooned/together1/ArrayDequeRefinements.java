package together1;
import liquidjava.*;
@together1.ExternalRefinementsFor("java.util.ArrayDeque")
@together1.Ghost("int size")
public interface ArrayDequeRefinements<E> {
    public void ArrayDeque();

    @together1.StateRefinement(to = "size(this) == (size(old(this)) + 1)")
    public boolean add(E elem);

    @together1.StateRefinement(to = "size(this) == (size(old(this)) + 1)")
    public boolean offerFirst(E elem);

    @together1.StateRefinement(from = "size(this) > 0", to = "size(this) == (size(old(this)))")
    public E getFirst();

    @together1.StateRefinement(from = "size(this) > 0", to = "size(this) == (size(old(this)))")
    public E getLast();

    @together1.StateRefinement(from = "size(this)> 0", to = "size(this) == (size(old(this)) - 1)")
    public void remove();

    @together1.StateRefinement(from = "size(this)> 0", to = "size(this) == (size(old(this)) - 1)")
    public E pop();

    @together1.Refinement("_ == size(this)")
    public int size();

    @together1.Refinement("_ == (size(this) <= 0)")
    public boolean isEmpty();
}