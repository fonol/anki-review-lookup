`blur_nested_tooltips`

You can nest tooltips (by selecting text in a tooltip), and if this is set to **true**,
all tooltips except for the topmost will have a blur effect applied.

Default = **true**

---------------------------------------------------------------
`results.font_size`

This sets the font size inside the search results.
Valid values are **"inherit"** or a number, e.g. **15**. 
**"inherit"** means take whatever font-size is set for the outside of the tooltip.

Default = **"inherit"**

---------------------------------------------------------------
`excluded_decks`

If you don't want notes from some decks to show up in the search results, add these 
decks here. Accepts a comma-separated list of deck names (case-sensitive!).
E.g. **["deck 1", "parent deck::child deck"]**

Default = **[]**