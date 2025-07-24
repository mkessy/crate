import { Doc } from "@effect/printer"
import { Chunk, Console, Effect, HashMap, Option, pipe } from "effect"
import type { Attribute } from "./Entity.js"
import { type IOntology, Ontology } from "./Ontology.js"
import type { Predicate, PredicateSignature, PredicateUri } from "./Predicate.js"

// ============================================================================
// Type Definitions for Annotations
// ============================================================================

/**
 * Semantic annotations for different parts of the ontology
 * @since 1.0.0
 */
export type OntologyAnnotation =
  | { readonly _tag: "header" }
  | { readonly _tag: "entity" }
  | { readonly _tag: "predicate" }
  | { readonly _tag: "attribute" }
  | { readonly _tag: "signature" }
  | { readonly _tag: "hierarchy" }
  | { readonly _tag: "symbol" }
  | { readonly _tag: "emphasis" }
  | { readonly _tag: "count" }
  | { readonly _tag: "description" }

// ============================================================================
// Visual Language Components
// ============================================================================

/**
 * Unicode symbols for visual hierarchy
 * @since 1.0.0
 */
const symbols = {
  // Structural elements
  cornerTop: "┌",
  cornerBottom: "└",
  vertical: "│",
  horizontal: "─",
  cross: "┼",
  tee: "├",

  // Arrows and pointers
  arrow: "→",
  backArrow: "←",
  doubleArrow: "⇄",
  mapsto: "↦",

  // Set theory
  subset: "⊂",
  element: "∈",
  cross_product: "×",
  power_set: "𝒫",

  // Logic
  forall: "∀",
  exists: "∃",

  // Decorative
  bullet: "•",
  diamond: "◆",
  circle: "○",
  square: "□",
  star: "★"
} as const

/**
 * Create an annotated document
 * @since 1.0.0
 */
const annotate = <A extends OntologyAnnotation>(annotation: A) => (doc: Doc.Doc<never>): Doc.Doc<A> =>
  Doc.annotate(doc, annotation)

/**
 * Create a styled header with visual hierarchy
 * @since 1.0.0
 */
const header = (level: 1 | 2 | 3) => (title: string): Doc.Doc<OntologyAnnotation> => {
  const styles = {
    1: {
      border: "═",
      width: 80,
      decorator: symbols.diamond,
      spacing: 2
    },
    2: {
      border: "─",
      width: 60,
      decorator: symbols.bullet,
      spacing: 1
    },
    3: {
      border: "·",
      width: 40,
      decorator: symbols.circle,
      spacing: 0
    }
  }

  const style = styles[level]
  const borderLine = style.border.repeat(style.width)

  return pipe(
    Doc.vsep([
      ...(level === 1 ? [Doc.text(borderLine)] : []),
      Doc.hsep([
        Doc.text(style.decorator),
        Doc.text(title),
        Doc.text(style.decorator)
      ]),
      Doc.text(borderLine),
      ...(style.spacing > 0 ? Array.from({ length: style.spacing }, () => Doc.empty) : [])
    ]),
    annotate({ _tag: "header" })
  )
}

/**
 * Create a visually appealing box with rounded corners
 * @since 1.0.0
 */
const box = (content: Doc.Doc<OntologyAnnotation>, width: number = 50): Doc.Doc<OntologyAnnotation> => {
  const topBorder = `╭${"─".repeat(width - 2)}╮`
  const bottomBorder = `╰${"─".repeat(width - 2)}╯`

  return Doc.vsep([
    Doc.text(topBorder),
    pipe(
      content,
      Doc.indent(2),
      (doc) => Doc.hsep([Doc.text("│"), doc, Doc.text("│")])
    ),
    Doc.text(bottomBorder)
  ])
}

/**
 * Create a tree visualization with proper indentation
 * @since 1.0.0
 */
const tree = (
  items: ReadonlyArray<{
    label: string
    annotation?: OntologyAnnotation
    children?: ReadonlyArray<{ label: string; annotation?: OntologyAnnotation }>
  }>
): Doc.Doc<OntologyAnnotation> => {
  const renderItem = (item: typeof items[number], isLast: boolean, indent: string = "") => {
    const prefix = isLast ? "└─" : "├─"
    const childIndent = indent + (isLast ? "   " : "│  ")

    const itemDoc = pipe(
      Doc.text(item.label),
      item.annotation ? annotate(item.annotation) : (x: Doc.Doc<never>) => x
    )

    const mainLine = Doc.hsep([Doc.text(indent + prefix), itemDoc])

    if (item.children && item.children.length > 0) {
      const childDocs: Array<Doc.Doc<OntologyAnnotation>> = item.children.map((child, idx) =>
        renderItem(
          { label: child.label, annotation: child.annotation as OntologyAnnotation },
          idx === item.children!.length - 1,
          childIndent
        )
      )
      return Doc.vsep([mainLine, ...childDocs])
    }

    return mainLine
  }

  return Doc.vsep(items.map((item, idx) => renderItem(item, idx === items.length - 1)))
}

/**
 * Create a grid layout for entity types
 * @since 1.0.0
 */
const entityGrid = (entities: ReadonlyArray<string>, columns: number = 4): Doc.Doc<OntologyAnnotation> => {
  const chunks = Chunk.chunksOf(Chunk.fromIterable(entities), columns)

  return pipe(
    chunks,
    Chunk.map((chunk) =>
      Doc.fillSep(
        Chunk.toReadonlyArray(
          Chunk.map(chunk, (entity) =>
            pipe(
              Doc.text(entity),
              annotate({ _tag: "entity" }),
              (doc) => Doc.hsep([Doc.text(symbols.square), doc])
            ))
        )
      )
    ),
    Chunk.toReadonlyArray,
    Doc.vsep
  )
}

/**
 * Create a mathematical function notation
 * @since 1.0.0
 */
const functionNotation = (
  name: string,
  domain: string,
  codomain: string
): Doc.Doc<OntologyAnnotation> =>
  Doc.group(
    Doc.hsep([
      pipe(Doc.text(name), annotate({ _tag: "symbol" })),
      Doc.text(":"),
      Doc.text(domain),
      pipe(Doc.text(symbols.arrow), annotate({ _tag: "symbol" })),
      Doc.text(codomain)
    ])
  )

/**
 * Create a formal set notation
 * @since 1.0.0
 */
const setNotation = (
  name: string,
  elements: ReadonlyArray<string>,
  maxDisplay: number = 5
): Doc.Doc<OntologyAnnotation> => {
  const displayElements = elements.slice(0, maxDisplay)
  const hasMore = elements.length > maxDisplay

  const elementsDoc = Doc.fillSep([
    ...displayElements.map((e) => Doc.text(e + ",")),
    ...(hasMore ? [Doc.text(`... (+${elements.length - maxDisplay} more)`)] : [])
  ])

  return Doc.group(
    Doc.hsep([
      pipe(Doc.text(name), annotate({ _tag: "symbol" })),
      Doc.text("="),
      Doc.text("{"),
      Doc.align(elementsDoc),
      Doc.text("}")
    ])
  )
}

// ============================================================================
// Ontology Component Visualizations
// ============================================================================

/**
 * Visualize entity types with enhanced typography
 * @since 1.0.0
 */
const visualizeEntityTypes = (entities: HashMap.HashMap<string, any>): Doc.Doc<OntologyAnnotation> => {
  const entityTypes = Array.from(HashMap.keys(entities))

  return Doc.vsep([
    header(2)(`Entity Types T`),
    pipe(
      Doc.text(`${symbols.forall} t ${symbols.element} T, |T| = ${entityTypes.length}`),
      annotate({ _tag: "count" })
    ),
    Doc.empty,
    box(entityGrid(entityTypes.slice(0, 20), 3)),
    entityTypes.length > 20
      ? pipe(
        Doc.text(`... and ${entityTypes.length - 20} more entity types`),
        annotate({ _tag: "description" }),
        Doc.indent(2)
      )
      : Doc.empty
  ])
}

/**
 * Visualize attributes with rich formatting
 * @since 1.0.0
 */
const visualizeAttributes = (attributes: HashMap.HashMap<string, Attribute>): Doc.Doc<OntologyAnnotation> => {
  const attrs = Array.from(HashMap.values(attributes)).slice(0, 12)

  const attrTree = attrs.map((attr) => ({
    label: `${attr.name}: ${attr.type.valueOf()}`,
    annotation: { _tag: "attribute" } as OntologyAnnotation,
    children: [
      {
        label: attr.description.slice(0, 60) + (attr.description.length > 60 ? "..." : ""),
        annotation: { _tag: "description" } as OntologyAnnotation
      },
      ...(attr.allowedValues.size > 0
        ? [{
          label: `Values: {${Array.from(attr.allowedValues).slice(0, 3).join(", ")}${
            attr.allowedValues.size > 3 ? "..." : ""
          }}`,
          annotation: { _tag: "description" } as OntologyAnnotation
        }]
        : [])
    ]
  }))

  return Doc.vsep([
    header(2)(`Attribute Types A`),
    pipe(
      Doc.text(`${symbols.forall} a ${symbols.element} A, |A| = ${HashMap.size(attributes)}`),
      annotate({ _tag: "count" })
    ),
    Doc.empty,
    tree(attrTree),
    HashMap.size(attributes) > 12
      ? Doc.indent(
        pipe(
          Doc.text(`... and ${HashMap.size(attributes) - 12} more attributes`),
          annotate({ _tag: "description" })
        ),
        2
      )
      : Doc.empty
  ])
}

/**
 * Visualize predicates with relationship notation
 * @since 1.0.0
 */
const visualizePredicates = (predicates: HashMap.HashMap<string, Predicate>): Doc.Doc<OntologyAnnotation> => {
  const preds = Array.from(HashMap.values(predicates)).slice(0, 10)

  const predDocs = preds.map((pred) =>
    Doc.vsep([
      Doc.group(
        Doc.fillSep([
          pipe(Doc.text(symbols.diamond), annotate({ _tag: "symbol" })) as unknown as Doc.Doc<OntologyAnnotation>,
          pipe(Doc.text(pred.forwardPhrase), annotate({ _tag: "predicate" })),
          Doc.text("/"),
          pipe(Doc.text(pred.reversePhrase), annotate({ _tag: "predicate" }))
        ])
      ),
      Doc.indent(
        Doc.group(
          Doc.fillSep([
            pipe(
              Doc.text(pred.description.slice(0, 80) + (pred.description.length > 80 ? "..." : "")),
              annotate({ _tag: "description" })
            )
          ])
        ),
        4
      ),
      Doc.indent(
        Doc.hsep([
          Doc.text("Attributes:"),
          pipe(
            Doc.text(`{${pred.attributes.size} attributes}`),
            annotate({ _tag: "count" })
          )
        ]) as unknown as Doc.Doc<OntologyAnnotation>,
        4
      )
    ])
  )

  return Doc.vsep([
    header(2)(`Predicate Types P`),
    pipe(
      Doc.text(`${symbols.forall} p ${symbols.element} P, |P| = ${HashMap.size(predicates)}`),
      annotate({ _tag: "count" })
    ),
    Doc.empty,
    ...(predDocs as unknown as Array<Doc.Doc<OntologyAnnotation>>),
    HashMap.size(predicates) > 10
      ? Doc.indent(
        pipe(
          Doc.text(`... and ${HashMap.size(predicates) - 10} more predicates`),
          annotate({ _tag: "description" })
        ),
        2
      )
      : Doc.empty
  ])
}

/**
 * Visualize predicate signatures with mathematical notation
 * @since 1.0.0
 */
const visualizeSignatures = (
  signatures: HashMap.HashMap<PredicateUri, PredicateSignature>,
  predicates: HashMap.HashMap<string, Predicate>
): Doc.Doc<OntologyAnnotation> => {
  const sampleSigs = Array.from(HashMap.entries(signatures)).slice(0, 8)

  const sigDocs = sampleSigs.map(([predUri, sig]) => {
    const pred = Array.from(HashMap.values(predicates))
      .find((p) => p.id.valueOf() === predUri.valueOf())

    if (!pred) return Doc.empty

    return Doc.group(
      Doc.fillSep([
        functionNotation(
          "δ",
          pred.forwardPhrase,
          `${sig.subject.valueOf()} ${symbols.cross_product} ${sig.object.valueOf()}`
        )
      ])
    )
  })

  return Doc.vsep([
    header(2)(`Predicate Signatures δ`),
    functionNotation("δ", "P", `T ${symbols.cross_product} T`),
    Doc.empty,
    box(Doc.vsep(sigDocs)),
    HashMap.size(signatures) > 8
      ? Doc.indent(
        pipe(
          Doc.text(`... and ${HashMap.size(signatures) - 8} more signatures`),
          annotate({ _tag: "description" })
        ),
        2
      )
      : Doc.empty
  ])
}

/**
 * Visualize predicate hierarchy with tree structure
 * @since 1.0.0
 */
const visualizeHierarchy = (
  hierarchy: HashMap.HashMap<PredicateUri, ReadonlySet<PredicateUri>>,
  predicates: HashMap.HashMap<string, Predicate>
): Doc.Doc<OntologyAnnotation> => {
  const topLevel = Array.from(HashMap.entries(hierarchy))
    .filter(([_, children]) => children.size > 0)
    .slice(0, 6)

  const hierarchyItems = topLevel.map(([parentUri, childrenUris]) => {
    const parent = Array.from(HashMap.values(predicates))
      .find((p) => p.id.valueOf() === parentUri.valueOf())

    if (!parent) return null

    const children = Array.from(childrenUris)
      .map((childUri) => {
        const child = Array.from(HashMap.values(predicates))
          .find((p) => p.id.valueOf() === childUri.valueOf())
        return child ? { label: child.forwardPhrase, annotation: { _tag: "predicate" as const } } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    return {
      label: parent.forwardPhrase,
      annotation: { _tag: "predicate" as const },
      children
    }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  return Doc.vsep([
    header(2)(`Predicate Hierarchy ≺`),
    Doc.text(`Partial order relation: ≺ ${symbols.subset} P ${symbols.cross_product} P`),
    Doc.empty,
    tree(hierarchyItems),
    HashMap.size(hierarchy) > 6
      ? Doc.indent(
        pipe(
          Doc.text(`... and ${HashMap.size(hierarchy) - 6} more hierarchical relations`),
          annotate({ _tag: "description" })
        ),
        2
      )
      : Doc.empty
  ])
}

/**
 * Create the formal ontology header
 * @since 1.0.0
 */
const formalHeader = (): Doc.Doc<OntologyAnnotation> =>
  Doc.vsep([
    header(1)("FORMAL ONTOLOGY STRUCTURE"),
    Doc.align(
      box(
        Doc.vsep([
          Doc.text("O = (T, P, A, δ, π, ≺)"),
          Doc.empty,
          Doc.text("where:"),
          Doc.indent(
            Doc.vsep([
              Doc.text(`T = Set of entity types`),
              Doc.text(`P = Set of predicate types`),
              Doc.text(`A = Set of attribute types`),
              functionNotation("δ", "P", `T ${symbols.cross_product} T`),
              functionNotation("π", "P", `${symbols.power_set}(A)`),
              Doc.text(`≺ ${symbols.subset} P ${symbols.cross_product} P (partial order)`)
            ]),
            2
          )
        ]),
        60
      )
    )
  ])

/**
 * Create a summary statistics panel
 * @since 1.0.0
 */
const summaryPanel = (ontology: IOntology): Doc.Doc<OntologyAnnotation> => {
  const stats = [
    { label: "Entity Types", value: ontology.getEntityTypes().length },
    { label: "Predicates", value: ontology.getPredicateTypes().length },
    { label: "Attributes", value: ontology.getAttributes().length },
    { label: "Signatures", value: ontology.getPredicateSignatures().length },
    { label: "Hierarchies", value: HashMap.size(ontology.predicateHierarchy) }
  ]

  const maxLabelLength = Math.max(...stats.map((s) => s.label.length))

  const statDocs = stats.map((stat) =>
    Doc.hsep([
      Doc.text(stat.label.padEnd(maxLabelLength)),
      Doc.text(":"),
      pipe(
        Doc.text(stat.value.toString().padStart(5)),
        annotate({ _tag: "count" })
      )
    ])
  )

  return box(
    Doc.vsep([
      pipe(
        Doc.text("ONTOLOGY STATISTICS"),
        annotate({ _tag: "emphasis" })
      ),
      Doc.text("─".repeat(30)),
      ...(statDocs as unknown as Array<Doc.Doc<OntologyAnnotation>>)
    ]),
    35
  )
}

// ============================================================================
// Main Visualization Functions
// ============================================================================

/**
 * Create a complete ontology visualization with enhanced typography
 * @since 1.0.0
 */
export const visualizeOntology = (width: number = 100) => (ontology: IOntology): string => {
  const doc = Doc.vsep([
    formalHeader(),
    Doc.empty,
    summaryPanel(ontology),
    Doc.empty,
    visualizeEntityTypes(ontology.entityFactories),
    Doc.empty,
    visualizeAttributes(ontology.attributes),
    Doc.empty,
    visualizePredicates(ontology.predicates),
    Doc.empty,
    visualizeSignatures(ontology.predicateSignatures, ontology.predicates),
    Doc.empty,
    visualizeHierarchy(ontology.predicateHierarchy, ontology.predicates),
    Doc.empty,
    header(1)("END")
  ])

  return Doc.render(doc, {
    style: "pretty",
    options: {
      lineWidth: width,
      ribbonFraction: 0.8
    }
  })
}

/**
 * Create a focused visualization for a specific entity type
 * @since 1.0.0
 */
export const visualizeEntityRelations = (entityType: string) => (ontology: IOntology): string => {
  const outgoing = ontology.predicatesBySourceEntity.pipe(
    HashMap.get(entityType),
    Option.getOrElse(() => [] as ReadonlyArray<Predicate>)
  )

  const incoming = ontology.predicatesByTargetEntity.pipe(
    HashMap.get(entityType),
    Option.getOrElse(() => [] as ReadonlyArray<Predicate>)
  )

  const outgoingTree = outgoing.slice(0, 15).map((pred) => ({
    label: pred.forwardPhrase,
    annotation: { _tag: "predicate" as const },
    children: [
      {
        label: `${symbols.arrow} ${pred.description.slice(0, 50)}...`,
        annotation: { _tag: "description" as const }
      },
      {
        label: `Attributes: ${pred.attributes.size}`,
        annotation: { _tag: "count" as const }
      }
    ]
  }))

  const incomingTree = incoming.slice(0, 15).map((pred) => ({
    label: pred.reversePhrase,
    annotation: { _tag: "predicate" as const },
    children: [
      {
        label: `${symbols.backArrow} ${pred.description.slice(0, 50)}...`,
        annotation: { _tag: "description" as const }
      },
      {
        label: `Attributes: ${pred.attributes.size}`,
        annotation: { _tag: "count" as const }
      }
    ]
  }))

  const doc = Doc.vsep([
    header(1)(`Entity Relations: ${entityType}`),
    Doc.empty,
    Doc.hsep([
      box(
        Doc.vsep([
          pipe(Doc.text(`OUTGOING (${outgoing.length})`), annotate({ _tag: "emphasis" })),
          Doc.empty,
          tree(outgoingTree),
          outgoing.length > 15
            ? pipe(
              Doc.text(`... +${outgoing.length - 15} more`),
              annotate({ _tag: "description" })
            )
            : Doc.empty
        ]),
        45
      ),
      Doc.text("  "),
      box(
        Doc.vsep([
          pipe(Doc.text(`INCOMING (${incoming.length})`), annotate({ _tag: "emphasis" })),
          Doc.empty,
          tree(incomingTree),
          incoming.length > 15
            ? pipe(
              Doc.text(`... +${incoming.length - 15} more`),
              annotate({ _tag: "description" })
            )
            : Doc.empty
        ]),
        45
      )
    ])
  ])

  return Doc.render(doc, {
    style: "pretty",
    options: {
      lineWidth: 100,
      ribbonFraction: 0.9
    }
  })
}

/**
 * Create a compact summary view
 * @since 1.0.0
 */
export const visualizeSummary = (ontology: IOntology): string => {
  const doc = Doc.vsep([
    header(2)("Ontology Summary"),
    summaryPanel(ontology),
    Doc.empty,
    setNotation("T", ontology.getEntityTypes().slice(0, 8), 8),
    Doc.empty,
    setNotation("P", ontology.getPredicateTypes().slice(0, 6).map((p) => p.forwardPhrase), 6),
    Doc.empty,
    setNotation("A", ontology.getAttributes().slice(0, 6).map((a) => a.name), 6)
  ])

  return Doc.render(doc, {
    style: "pretty",
    options: {
      lineWidth: 80,
      ribbonFraction: 0.8
    }
  })
}

// ============================================================================
// Effect Integration
// ============================================================================

/**
 * Effect that retrieves and visualizes the ontology
 * @since 1.0.0
 */
export const showOntology = Effect.gen(function*() {
  const ontology = yield* Ontology
  const visualization = visualizeOntology(120)(ontology)
  yield* Console.log(visualization)
})

/**
 * Effect that shows relations for a specific entity type
 * @since 1.0.0
 */
export const showEntityRelations = (entityType: string) =>
  Effect.gen(function*() {
    const ontology = yield* Ontology
    const visualization = visualizeEntityRelations(entityType)(ontology)
    yield* Console.log(visualization)
  })

/**
 * Effect that shows a compact summary
 * @since 1.0.0
 */
export const showSummary = Effect.gen(function*() {
  const ontology = yield* Ontology
  const visualization = visualizeSummary(ontology)
  yield* Console.log(visualization)
})
