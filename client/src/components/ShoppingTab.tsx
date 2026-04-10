import { useShopping } from '../hooks/useShopping';

export function ShoppingTab() {
  const { shoppingCategories, totalItems, boughtItems, isShoppingGenerated, peopleCount, toggleItem, reset, updatePeopleCount } = useShopping();

  const progress = totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-surface border-b border-border px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-dimmed text-xs font-sans uppercase tracking-wide">Weekly Shop</p>
            <h2 className="font-display font-bold text-primary text-xl">Shopping List</h2>
          </div>
          <button onClick={reset}
            className="text-sm font-sans text-secondary hover:text-primary bg-elevated px-3 py-1.5 rounded-lg transition-colors border border-border">Reset</button>
        </div>

        {/* People multiplier */}
        {isShoppingGenerated && (
          <div className="mb-3">
            <p className="text-secondary text-xs font-sans mb-1.5">For how many people?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => updatePeopleCount(n)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-sans font-medium transition-all ${
                    peopleCount === n ? 'bg-accent text-white' : 'bg-elevated text-secondary hover:bg-elevated/80 border border-border'}`}>
                  {n}{n === 5 ? '+' : ''}
                </button>
              ))}
            </div>
            {peopleCount > 1 && (
              <p className="text-accent text-xs font-sans mt-1.5">Quantities adjusted for {peopleCount} people</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm font-sans mb-2">
          <span className="text-secondary"><span className="font-mono">{boughtItems}</span> of <span className="font-mono">{totalItems}</span> items bought</span>
          <span className="text-accent font-semibold font-mono">{progress}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {shoppingCategories.map((cat) => {
          const catBought = cat.items.filter(i => i.bought).length;
          return (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-sans font-semibold text-primary text-sm">{cat.name}</h3>
                <span className="text-xs font-sans font-mono text-secondary">{catBought}/{cat.items.length}</span>
              </div>
              <div className="space-y-1.5">
                {cat.items.map((item) => {
                  const displayQty = item.quantity && peopleCount > 1
                    ? multiplyQuantity(item.quantity, peopleCount, item.unit)
                    : item.quantity;
                  return (
                    <div key={item.key} onClick={() => toggleItem(item.key, item.bought)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-97 card-glow ${
                        item.bought ? 'bg-success-fill border border-success/30 opacity-60' : 'bg-surface border border-border hover:bg-elevated'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.bought ? 'bg-success border-success' : 'border-border bg-surface'}`}>
                        {item.bought && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-sans ${item.bought ? 'line-through text-dimmed' : 'text-primary'}`}>
                          {item.name}
                        </span>
                        {displayQty && (
                          <span className="text-xs text-secondary font-mono ml-1.5">
                            ({displayQty}{item.unit ? ` ${item.unit}` : ''})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="h-4" />
      </div>
    </div>
  );
}

function multiplyQuantity(qty: string, multiplier: number, unit?: string): string {
  const num = parseFloat(qty);
  if (isNaN(num)) return qty;
  const result = num * multiplier;
  return Number.isInteger(result) ? String(result) : result.toFixed(1);
}
