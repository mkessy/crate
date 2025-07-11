import { EntityResolution, Nlp } from "@crate/domain"
import { Effect, Layer } from "effect"
import model from "wink-eng-lite-web-model"
import winkNLP, { type CustomEntityExample, type Document as WinkDocument } from "wink-nlp"

/**
 * Configuration schema for the NlpService.
 * Allows for declarative and type-safe configuration.
 */
interface WinkConfig {
  includeCustomEntities: boolean
  customEntities: Array<CustomEntityExample>
}

const DefaultConfig: WinkConfig = {
  includeCustomEntities: true,
  customEntities: [
    { name: "ARTIST_CANDIDATE", patterns: ["PROPN", "[PROPN]?", "[PROPN]?"] }
  ]
}

/**
 * Creates the NlpService layer with optional configuration.
 * This is the primary entry point for creating the service.
 *
 * @param config Optional configuration for the NLP service.
 * @returns A Layer providing the live NlpService.
 */
export const Make = (config: WinkConfig = DefaultConfig): Layer.Layer<Nlp.Nlp> =>
  Layer.sync(
    Nlp.Nlp,
    () => {
      // --- 1. Configure and Initialize the NLP Engine ---
      const nlp = winkNLP(model, ["sbd", "ner", "pos", "cer"])
      const its = nlp.its

      // Conditionally add our custom entity patterns.
      if (config.includeCustomEntities) {
        nlp.learnCustomEntities(config.customEntities)
      }

      // --- 2. Internal Helper Functions ---

      /**
       * Calculate character positions for tokens by reconstructing from sentence boundaries
       */
      const calculateTokenPositions = (doc: WinkDocument) => {
        const originalText = doc.out()
        const tokenPositions: Array<{ start: number; end: number }> = []
        let currentOffset = 0

        doc.sentences().each((sentence: any) => {
          const sentenceText = sentence.out()
          const sentenceStartInDoc = originalText.indexOf(sentenceText, currentOffset)

          let tokenOffsetInSentence = 0
          sentence.tokens().each((token: any) => {
            const tokenText = token.out()
            const tokenStartInSentence = sentenceText.indexOf(tokenText, tokenOffsetInSentence)

            const absoluteStart = sentenceStartInDoc + tokenStartInSentence
            const absoluteEnd = absoluteStart + tokenText.length

            tokenPositions.push({ start: absoluteStart, end: absoluteEnd })
            tokenOffsetInSentence = tokenStartInSentence + tokenText.length
          })

          currentOffset = sentenceStartInDoc + sentenceText.length
        })

        return tokenPositions
      }

      /**
       * Extracts domain `Token` objects from a processed `WinkDoc`.
       */
      const _getTokens = (doc: WinkDocument): ReadonlyArray<Nlp.Token> => {
        const allTokens: Array<Nlp.Token> = []
        const positions = calculateTokenPositions(doc)
        let tokenIndex = 0

        doc.sentences().each((sentence, sentenceIndex) => {
          let isFirstTokenInSentence = true
          sentence.tokens().each((token: any) => {
            const position = positions[tokenIndex]
            allTokens.push(
              new Nlp.Token({
                text: token.out(),
                start: position.start,
                end: position.end,
                sentence: sentenceIndex,
                isSentenceStart: isFirstTokenInSentence
              })
            )
            tokenIndex++
            isFirstTokenInSentence = false
          })
        })
        return allTokens
      }

      /**
       * Extracts all entities (default and custom) and returns them as RawMentions.
       */
      const _getEntities = (doc: WinkDocument): ReadonlyArray<EntityResolution.RawMention> => {
        const allEntities: Array<EntityResolution.RawMention> = []

        // Get default entities with their spans
        doc.entities().each((entity: any) => {
          const entityText = entity.out(its.detail)
          const span = entity.out(its.span)
          // Find the position in the original text

          allEntities.push(
            new EntityResolution.RawMention({
              text: entityText.value,
              span: EntityResolution.Range({ start: span[0], end: span[1] }),
              source: "pattern"
            })
          )
        })

        // Get custom entities with their spans
        if (config.includeCustomEntities) {
          doc.customEntities().each((entity: any) => {
            const entityText = entity.out(its.detail)
            // Find the position in the original text
            const span = entity.out(its.span)

            allEntities.push(
              new EntityResolution.RawMention({
                text: entityText.value,
                span: EntityResolution.Range({ start: span[0], end: span[1] }),
                source: "pattern"
              })
            )
          })
        }

        return allEntities
      }

      // --- 3. Public Service Interface Implementation ---

      return Nlp.Nlp.of({
        processText: (text: string) => Effect.sync(() => nlp.readDoc(text) as unknown as Nlp.WinkDoc),

        extractTokens: (doc: Nlp.WinkDoc) => Effect.sync(() => _getTokens(doc as unknown as WinkDocument)),

        extractEntities: (doc: Nlp.WinkDoc) => Effect.sync(() => _getEntities(doc as unknown as WinkDocument))
      })
    }
  )

/**
 * A default, pre-configured NlpService layer for common use cases.
 */
export const Default = Make()
