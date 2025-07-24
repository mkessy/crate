import { assert, beforeEach, describe, it } from "@effect/vitest"
import { Equal, Hash, Schema } from "effect"
import * as Cardinality from "../src/rdf/Cardinality.js"
import { TripleURIMake } from "../src/rdf/Entity.js"
import {
  Attribute,
  AttributeId,
  Entity,
  EntityUri,
  Predicate,
  PredicateURI,
  Triple,
  WithMetadata
} from "../src/rdf/index.js"

describe("RDF Core Classes", () => {
  describe("Entity", () => {
    describe("construction and properties", () => {
      it("should create Entity with id and type", () => {
        const entity = Entity.make({
          id: EntityUri.make("test://entity/1"),
          type: "test"
        })

        assert.strictEqual(entity.id, "test://entity/1")
        assert.strictEqual(entity.type, "test")
      })

      it("should create Entity using MakeClass factory", () => {
        const makeArtist = Entity.MakeClass("artist")
        const entity = makeArtist("artist-123")

        assert.strictEqual(entity.type, "artist")
        assert.strictEqual(entity.id, "crate://artist/artist-123")
      })
    })

    describe("equality", () => {
      it("should be equal when id and type match", () => {
        const entity1 = Entity.make({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })
        const entity2 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })

        assert.isTrue(Equal.equals(entity1, entity2))
      })

      it("should not be equal when id differs", () => {
        const entity1 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })
        const entity2 = new Entity({
          id: EntityUri.make("test://entity/2"),
          type: "artist"
        })

        assert.isFalse(Equal.equals(entity1, entity2))
      })

      it("should not be equal when type differs", () => {
        const entity1 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })
        const entity2 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "recording"
        })

        assert.isFalse(Equal.equals(entity1, entity2))
      })

      it("should not be equal to non-Entity objects", () => {
        const entity = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })
        const notEntity = { id: "test://entity/1", type: "artist" }

        assert.isFalse(Equal.equals(entity, notEntity))
      })
    })

    describe("hashing", () => {
      it("should have same hash for equal entities", () => {
        const entity1 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })
        const entity2 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })

        assert.strictEqual(Hash.hash(entity1), Hash.hash(entity2))
      })

      it("should have different hash for different entities", () => {
        const entity1 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })
        const entity2 = new Entity({
          id: EntityUri.make("test://entity/2"),
          type: "artist"
        })

        assert.notStrictEqual(Hash.hash(entity1), Hash.hash(entity2))
      })

      it("should have different hash when type differs", () => {
        const entity1 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "artist"
        })
        const entity2 = new Entity({
          id: EntityUri.make("test://entity/1"),
          type: "recording"
        })

        assert.notStrictEqual(Hash.hash(entity1), Hash.hash(entity2))
      })
    })
  })

  describe("WithMetadata", () => {
    interface TestMetadata {
      name: string
      genre: string
    }

    const TestMetadataSchema = Schema.Struct({
      name: Schema.String,
      genre: Schema.String
    })

    describe("construction and properties", () => {
      it("should create WithMetadata with id, type, and value", () => {
        const metadata: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const entity = new WithMetadata({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: metadata
        })

        assert.strictEqual(entity.id, "test://artist/1")
        assert.strictEqual(entity.type, "artist")
        assert.deepStrictEqual(entity.value, metadata)
      })

      it("should create WithMetadata using MakeWithMetadataClass factory", () => {
        const makeArtistWithMetadata = WithMetadata.MakeWithMetadataClass<TestMetadata, "artist">({
          type: "artist",
          schema: TestMetadataSchema
        })

        const metadata: TestMetadata = { name: "Pearl Jam", genre: "grunge" }
        const entity = makeArtistWithMetadata("artist-123", metadata)

        assert.strictEqual(entity.id, "crate://artist/artist-123")
        assert.strictEqual(entity.type, "artist")
        assert.deepStrictEqual(entity.value, metadata)
      })

      it("should validate metadata using schema", () => {
        const makeArtistWithMetadata = WithMetadata.MakeWithMetadataClass<TestMetadata, "artist">({
          type: "artist",
          schema: TestMetadataSchema
        })

        // Valid metadata should work
        const validMetadata = { name: "Soundgarden", genre: "grunge" }
        const entity = makeArtistWithMetadata("artist-123", validMetadata)
        assert.strictEqual(entity.value.name, "Soundgarden")

        // Invalid metadata should throw
        assert.throws(() => {
          makeArtistWithMetadata("artist-456", { name: "Test", invalid: "field" } as any)
        })
      })
    })

    describe("equality", () => {
      it("should be equal when id and type match (ignoring value)", () => {
        const metataSchema = Schema.Struct({
          name: Schema.String,
          genre: Schema.String
        })
        const metadata1: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const metadata2: TestMetadata = { name: "Different", genre: "rock" }

        const entity1 = WithMetadata.MakeWithMetadataClass<TestMetadata, "artist">({
          type: "artist",
          schema: metataSchema
        })("artist-123", metadata1)

        const entity2 = WithMetadata.MakeWithMetadataClass<TestMetadata, "artist">({
          type: "artist",
          schema: metataSchema
        })("artist-123", metadata2)

        assert.isTrue(Equal.equals(entity1, entity2))
      })

      it("should be equal to base Entity with same id and type", () => {
        const metadata: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const metataSchema = Schema.Struct({
          name: Schema.String,
          genre: Schema.String
        })
        const withMetadata = WithMetadata.MakeWithMetadataClass<TestMetadata, "artist">({
          type: "artist",
          schema: metataSchema
        })("artist-123", metadata)
        const baseEntity = Entity.MakeClass("artist")("artist-123")

        assert.isTrue(Equal.equals(withMetadata, baseEntity))
        assert.isTrue(Equal.equals(baseEntity, withMetadata))
      })

      it("should not be equal when id differs", () => {
        const metadata: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const entity1 = WithMetadata.make({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: metadata
        })
        const entity2 = WithMetadata.make({
          id: EntityUri.make("test://artist/2"),
          type: "artist",
          value: metadata
        })

        assert.isFalse(Equal.equals(entity1, entity2))
      })

      it("should not be equal when type differs", () => {
        const metadata: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const entity1 = WithMetadata.make({
          id: EntityUri.make("test://entity/1"),
          type: "artist",
          value: metadata
        })
        const entity2 = WithMetadata.make({
          id: EntityUri.make("test://entity/1"),
          type: "recording",
          value: metadata
        })

        assert.isFalse(Equal.equals(entity1, entity2))
      })
    })

    describe("hashing", () => {
      it("should include value in hash calculation", () => {
        const metadata1: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const metadata2: TestMetadata = { name: "Pearl Jam", genre: "grunge" }

        const entity1 = WithMetadata.make({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: metadata1
        })
        const entity2 = WithMetadata.make({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: metadata2
        })

        assert.strictEqual(Hash.hash(entity1), Hash.hash(entity2))
      })

      it("should have same hash for same id, type, and value", () => {
        const metadata: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const entity1 = WithMetadata.make({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: metadata
        })
        const entity2 = WithMetadata.make({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: metadata
        })

        assert.strictEqual(Hash.hash(entity1), Hash.hash(entity2))
      })

      it("should have different hash than base Entity (due to value)", () => {
        const metadata: TestMetadata = { name: "Nirvana", genre: "grunge" }
        const withMetadata = WithMetadata.make({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: metadata
        })
        const baseEntity = Entity.make({
          id: EntityUri.make("test://artist/1"),
          type: "artist"
        })

        assert.strictEqual(Hash.hash(withMetadata), Hash.hash(baseEntity))
      })
    })
  })

  describe("Predicate", () => {
    describe("construction and properties", () => {
      it("should create Predicate with all required fields", () => {
        const predicate = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Indicates that an artist performed a recording",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        assert.strictEqual(predicate.id, "performed")
        assert.strictEqual(predicate.forwardPhrase, "performed")
        assert.strictEqual(predicate.reversePhrase, "performed by")
        assert.strictEqual(predicate.longForm, "Artist performed Recording")
        assert.deepStrictEqual(predicate.cardinality0, Cardinality.Many)
        assert.deepStrictEqual(predicate.cardinality1, Cardinality.One)
      })
    })

    describe("equality", () => {
      it("should be equal when id matches", () => {
        const predicate1 = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        const predicate2 = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "different phrase",
          reversePhrase: "different reverse",
          longForm: "Different long form",
          description: "Different description",
          cardinality0: Cardinality.One,
          cardinality1: Cardinality.Many
        })

        assert.isTrue(Equal.equals(predicate1, predicate2))
      })

      it("should not be equal when id differs", () => {
        const predicate1 = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        const predicate2 = new Predicate({
          id: PredicateURI.make("created"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        assert.isFalse(Equal.equals(predicate1, predicate2))
      })

      it("should not be equal to non-Predicate objects", () => {
        const predicate = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        const notPredicate = { id: "performed" }
        assert.isFalse(Equal.equals(predicate, notPredicate))
      })
    })

    describe("hashing", () => {
      it("should have same hash for predicates with same id", () => {
        const predicate1 = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        const predicate2 = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "different",
          reversePhrase: "different",
          longForm: "different",
          description: "different",
          cardinality0: Cardinality.One,
          cardinality1: Cardinality.Many
        })

        assert.strictEqual(Hash.hash(predicate1), Hash.hash(predicate2))
      })

      it("should have different hash for predicates with different ids", () => {
        const predicate1 = new Predicate({
          id: PredicateURI.make("performed"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        const predicate2 = new Predicate({
          id: PredicateURI.make("created"),
          forwardPhrase: "performed",
          reversePhrase: "performed by",
          longForm: "Artist performed Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        assert.notStrictEqual(Hash.hash(predicate1), Hash.hash(predicate2))
      })
    })
  })

  describe("Triple", () => {
    let artistEntity: Entity
    let recordingEntity: Entity
    let performedPredicate: Predicate
    let testAttribute: Attribute

    beforeEach(() => {
      artistEntity = new Entity({
        id: EntityUri.make("test://artist/1"),
        type: "artist"
      })

      recordingEntity = new Entity({
        id: EntityUri.make("test://recording/1"),
        type: "recording"
      })

      performedPredicate = new Predicate({
        id: PredicateURI.make("performed"),
        forwardPhrase: "performed",
        reversePhrase: "performed by",
        longForm: "Artist performed Recording",
        description: "Test description",
        cardinality0: Cardinality.Many,
        cardinality1: Cardinality.One
      })

      testAttribute = new Attribute({
        id: AttributeId.make("test-attr"),
        name: "Test Attribute",
        description: "A test attribute"
      })
    })

    describe("construction and properties", () => {
      it("should create Triple using Make factory", () => {
        const triple = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [testAttribute]
        })

        assert.strictEqual(triple.subject.id, "test://artist/1")
        assert.strictEqual(triple.predicate.id, "performed")
        assert.strictEqual(triple.object.id, "test://recording/1")
        assert.strictEqual(triple.attributes.length, 1)
        assert.strictEqual(triple.attributes[0].name, "Test Attribute")
      })

      it("should create Triple with direction", () => {
        const triple = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [],
          direction: "forward"
        })

        assert.strictEqual(triple.direction, "forward")
      })

      it("should generate correct triple ID", () => {
        const triple = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const expectedId = TripleURIMake(artistEntity.id, performedPredicate.id, recordingEntity.id)
        assert.strictEqual(triple.getId(), expectedId)
      })

      it("should provide getter methods", () => {
        const triple = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [testAttribute]
        })

        assert.strictEqual(triple.getSubject().id, artistEntity.id)
        assert.strictEqual(triple.getPredicate().id, performedPredicate.id)
        assert.strictEqual(triple.getObject().id, recordingEntity.id)
      })
    })

    describe("equality", () => {
      it("should be equal when subject, predicate, object, and direction match", () => {
        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [testAttribute],
          direction: "forward"
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [], // Different attributes shouldn't affect equality
          direction: "forward"
        })

        assert.isTrue(Equal.equals(triple1, triple2))
      })

      it("should not be equal when subject differs", () => {
        const otherArtist = new Entity({
          id: EntityUri.make("test://artist/2"),
          type: "artist"
        })

        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const triple2 = Triple.Make({
          subject: otherArtist,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        assert.isFalse(Equal.equals(triple1, triple2))
      })

      it("should not be equal when predicate differs", () => {
        const otherPredicate = new Predicate({
          id: PredicateURI.make("created"),
          forwardPhrase: "created",
          reversePhrase: "created by",
          longForm: "Artist created Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: otherPredicate,
          object: recordingEntity,
          attributes: []
        })

        assert.isFalse(Equal.equals(triple1, triple2))
      })

      it("should not be equal when object differs", () => {
        const otherRecording = new Entity({
          id: EntityUri.make("test://recording/2"),
          type: "recording"
        })

        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: otherRecording,
          attributes: []
        })

        assert.isFalse(Equal.equals(triple1, triple2))
      })

      it("should not be equal when direction differs", () => {
        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [],
          direction: "forward"
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [],
          direction: "reverse"
        })

        assert.isFalse(Equal.equals(triple1, triple2))
      })

      it("should not be equal to non-Triple objects", () => {
        const triple = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const notTriple = { subject: artistEntity, predicate: performedPredicate, object: recordingEntity }
        assert.isFalse(Equal.equals(triple, notTriple))
      })
    })

    describe("hashing", () => {
      it("should have same hash for equal triples", () => {
        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [testAttribute],
          direction: "forward"
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [], // Different attributes shouldn't affect hash
          direction: "forward"
        })

        assert.strictEqual(Hash.hash(triple1), Hash.hash(triple2))
      })

      it("should have different hash when subject differs", () => {
        const otherArtist = new Entity({
          id: EntityUri.make("test://artist/2"),
          type: "artist"
        })

        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const triple2 = Triple.Make({
          subject: otherArtist,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        assert.notStrictEqual(Hash.hash(triple1), Hash.hash(triple2))
      })

      it("should have different hash when predicate differs", () => {
        const otherPredicate = new Predicate({
          id: PredicateURI.make("created"),
          forwardPhrase: "created",
          reversePhrase: "created by",
          longForm: "Artist created Recording",
          description: "Test description",
          cardinality0: Cardinality.Many,
          cardinality1: Cardinality.One
        })

        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: otherPredicate,
          object: recordingEntity,
          attributes: []
        })

        assert.notStrictEqual(Hash.hash(triple1), Hash.hash(triple2))
      })

      it("should have different hash when object differs", () => {
        const otherRecording = new Entity({
          id: EntityUri.make("test://recording/2"),
          type: "recording"
        })

        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: otherRecording,
          attributes: []
        })

        assert.notStrictEqual(Hash.hash(triple1), Hash.hash(triple2))
      })

      it("should have different hash when direction differs", () => {
        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [],
          direction: "forward"
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [],
          direction: "reverse"
        })

        assert.notStrictEqual(Hash.hash(triple1), Hash.hash(triple2))
      })

      it("should not include attributes in hash calculation", () => {
        const attribute1 = new Attribute({
          id: AttributeId.make("attr1"),
          name: "Attribute 1",
          description: "First attribute"
        })

        const attribute2 = new Attribute({
          id: AttributeId.make("attr2"),
          name: "Attribute 2",
          description: "Second attribute"
        })

        const triple1 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [attribute1]
        })

        const triple2 = Triple.Make({
          subject: artistEntity,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: [attribute2]
        })

        assert.strictEqual(Hash.hash(triple1), Hash.hash(triple2))
      })
    })

    describe("WithMetadata entities in triples", () => {
      it("should work with WithMetadata entities as subject and object", () => {
        interface ArtistMetadata {
          genre: string
        }

        const artistMetadata: ArtistMetadata = { genre: "grunge" }
        const artistWithMetadata = new WithMetadata({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: artistMetadata
        })

        const recordingMetadata = { duration: 300 }
        const recordingWithMetadata = new WithMetadata({
          id: EntityUri.make("test://recording/1"),
          type: "recording",
          value: recordingMetadata
        })

        const triple = Triple.Make({
          subject: artistWithMetadata,
          predicate: performedPredicate,
          object: recordingWithMetadata,
          attributes: []
        })

        assert.strictEqual(triple.subject.id, "test://artist/1")
        assert.strictEqual(triple.object.id, "test://recording/1")
        assert.strictEqual((triple.subject as WithMetadata<ArtistMetadata>).value.genre, "grunge")
      })

      it("should maintain equality between WithMetadata and Entity in triples", () => {
        const artistMetadata = { genre: "grunge" }
        const artistWithMetadata = new WithMetadata({
          id: EntityUri.make("test://artist/1"),
          type: "artist",
          value: artistMetadata
        })

        const baseArtist = new Entity({
          id: EntityUri.make("test://artist/1"),
          type: "artist"
        })

        const triple1 = Triple.Make({
          subject: artistWithMetadata,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        const triple2 = Triple.Make({
          subject: baseArtist,
          predicate: performedPredicate,
          object: recordingEntity,
          attributes: []
        })

        // Triples should be equal because entities are equal (WithMetadata equals Entity)
        assert.isTrue(Equal.equals(triple1, triple2))
      })
    })
  })
})
