

@repair.regen.specification.StateSet({ "onHold", "itemChosen", "displayingValue", "sendItem" })
public class VendingMachine {
    @repair.regen.specification.StateRefinement(from = "onHold(this) || itemChosen(this)", to = "displayingValue(this)")
    public void chooseItem(java.lang.String name) {
    }

    public void showPrice(java.lang.String name) {
    }

    public void pay(java.lang.String name) {
    }

    public void getItem() {
    }
}

