import { TrendingUp, TrendingDown } from "lucide-react";

const currencies = [
  { name: "USD", value: "115.2", down: true },
  { name: "EUR", value: "127.2", down: false },
];

const gasPrices = [
  { name: "NBP", value: "2,210.9", down: false },
  { name: "TTF", value: "1,371.8", down: true },
  { name: "Germany VTP", value: "403.1", down: false },
  { name: "Austria VTP", value: "5,010", down: false },
  { name: "PSV", value: "97", down: false },
];

const CurrencyWidget = () => {
  return (
    <div className="bg-card rounded-lg p-3 text-sm">
      <p className="text-muted-foreground text-xs mb-2">Central Bank Rate, ₽ as of 03/15/2022</p>
      <div className="space-y-1 mb-3">
        {currencies.map((c) => (
          <div key={c.name} className="flex items-center justify-between">
            <span className={c.down ? "text-danger font-semibold" : "text-success font-semibold"}>{c.name}</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{c.value}</span>
              {c.down ? (
                <TrendingDown className="w-3.5 h-3.5 text-danger" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs mb-2">Gas Price, USD/thous. m³ as of 03/15/2022</p>
      <div className="space-y-1">
        {gasPrices.map((g) => (
          <div key={g.name} className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{g.name}</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{g.value}</span>
              {g.down ? (
                <TrendingDown className="w-3.5 h-3.5 text-danger" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyWidget;
