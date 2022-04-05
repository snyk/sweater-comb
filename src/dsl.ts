import {
  ApiCheckDsl,
  createSelectJsonPathHelper,
  DocsLinkHelper,
  EntityRule,
  newDocsLinkHelper,
  Result,
  runCheck,
  genericEntityRuleImpl,
} from "@useoptic/api-checks";

import niceTry from "nice-try";

import {
  ChangeType,
  ConceptualLocation,
  FieldLocation,
  IChange,
  IFact,
  ILocation,
  OpenApiFieldFact,
  OpenApiKind,
  OpenAPIV3,
  OperationLocation,
  PathParameterLocation,
  HeaderParameterLocation,
  ResponseHeaderLocation,
  ResponseLocation,
  QueryParameterLocation,
  ShouldOrMust,
  ChangeVariant,
} from "@useoptic/openapi-utilities";
import { jsonPointerHelpers } from "@useoptic/json-pointer-helpers";

type SnykStablity = "wip" | "experimental" | "beta" | "ga";
type DateString = string; // YYYY-mm-dd
type ResourceName = string;

export interface SynkApiCheckContext {
  // Vervet provides context about the change itself. Since
  // Optic is analyzing two OpenAPI spec files, we need to tell it
  // when the change is supposed to happen, and the resource/version info
  // determined by the file's location in a directory structure.
  changeDate: DateString; // when the change did (or would, if proposed) occur
  changeResource: ResourceName; // the spec resource being changed
  changeVersion: {
    // the spec version being changed
    date: DateString;
    stability: SnykStablity;
  };

  // Vervet provides a mapping that indicates the resource version deprecation.
  // It has this information because it processes the entire source tree of
  // spec files.
  resourceVersions: {
    [ResourceName: string]: {
      // changeResource used to match this
      [DateString: string]: {
        // changeVersion.date used to match this
        [SnykStablity: string]: {
          // changeVersion.stability matches this
          deprecatedBy: {
            // the spec version that deprecates this one (if any) or null
            date: DateString;
            stability: SnykStablity; // could be higher stability than changed!
          } | null;
        };
      };
    };
  };
}

export interface SnykEntityRule<T, A>
  extends EntityRule<T, ConceptualLocation, SynkApiCheckContext, A> {}

export class SnykApiCheckDsl implements ApiCheckDsl {
  private checks: Promise<Result>[] = [];

  constructor(
    private nextFacts: IFact[],
    private changelog: IChange[],
    private currentJsonLike: OpenAPIV3.Document,
    private nextJsonLike: OpenAPIV3.Document,
    private providedContext: SynkApiCheckContext,
  ) {}

  checkPromises() {
    return this.checks;
  }

  getOperationContext(
    location: ILocation,
  ): OperationLocation & SynkApiCheckContext & { isSingletonPath: boolean } {
    if (!("path" in location.conceptualLocation))
      throw new Error(
        "Can not get operation context from non-operation location",
      );

    const pathSpecItem = jsonPointerHelpers.tryGet(
      this.nextJsonLike,
      jsonPointerHelpers.compile(["paths", location.conceptualLocation.path]),
    );
    return {
      ...location.conceptualLocation,
      ...this.providedContext,
      isSingletonPath:
        pathSpecItem.match && pathSpecItem.value["x-snyk-resource-singleton"],
    };
  }

  get operations() {
    const operations = this.changelog.filter(
      (i) => i.location.kind === OpenApiKind.Operation,
    ) as ChangeVariant<OpenApiKind.Operation>[];

    const added = operations.filter((i) => Boolean(i.added));
    const removed = operations.filter((i) => Boolean(i.removed));
    const changes = operations.filter((i) => Boolean(i.changed));

    const locations = [
      ...added.map((i) => i.location),
      ...changes.map((i) => i.location),
      ...removed.map((i) => i.location),
    ];

    const pathsSelectorsInputs = locations.map((i) => {
      return {
        conceptualLocation: i.conceptualLocation,
        current:
          niceTry(() =>
            jsonPointerHelpers.get(this.currentJsonLike, i.jsonPath),
          ) || {},
        next:
          niceTry(() =>
            jsonPointerHelpers.get(this.nextJsonLike, i.jsonPath),
          ) || {},
      };
    });

    const { selectJsonPath } = createSelectJsonPathHelper(pathsSelectorsInputs);

    return {
      selectJsonPath,
      ...genericEntityRuleImpl<
        OpenApiKind.Operation,
        OperationLocation,
        SynkApiCheckContext & { isSingletonPath: boolean },
        OpenAPIV3.OperationObject
      >(
        OpenApiKind.Operation,
        this.changelog,
        this.nextFacts,
        (opFact) => `${opFact.method.toUpperCase()} ${opFact.pathPattern}`,
        (location) => this.getOperationContext(location),
        (...items) => this.checks.push(...items),
        (pointer: string) => jsonPointerHelpers.get(this.nextJsonLike, pointer),
      ),
    };
  }

  get context() {
    const change: IChange = {
      location: {
        conceptualLocation: { path: "Resource Document", method: "" },
        jsonPath: "/",
        conceptualPath: [],
        kind: "API",
      },
    } as any;

    const value: ShouldOrMust<
      (
        context: SynkApiCheckContext,
        docs: DocsLinkHelper,
      ) => Promise<void> | void
    > = {
      must: (statement, handler) => {
        const docsHelper = newDocsLinkHelper();
        this.checks.push(
          runCheck(
            change,
            docsHelper,
            "this specification: ",
            statement,
            true,
            () => handler(this.providedContext, docsHelper),
          ),
        );
      },
    };

    return value;
  }

  get stability() {
    const stabilityExtensionName = "x-snyk-api-stability";
    this.currentJsonLike[stabilityExtensionName] || undefined;

    const changed: IChange = {
      changed: {
        before: this.currentJsonLike[stabilityExtensionName] || undefined,
        after: this.nextJsonLike[stabilityExtensionName] || undefined,
      },
      location: {
        jsonPath: jsonPointerHelpers.compile([stabilityExtensionName]),
        conceptualPath: [stabilityExtensionName],
        kind: "SnykStability",
        conceptualLocation: {
          // this is temp hack until optic-ci supports more grouping
          path: "Resource Document",
          method: "",
        },
      },
    } as any;

    const handlers: ShouldOrMust<
      (
        from: SnykStablity | undefined,
        to: SnykStablity | undefined,
        context: SynkApiCheckContext,
        docs: DocsLinkHelper,
      ) => Promise<void> | void
    > = {
      must: (statement, handler) => {
        const docsHelper = newDocsLinkHelper();
        this.checks.push(
          runCheck(
            changed as any,
            docsHelper,
            `published stability: `,
            statement,
            true,
            () =>
              handler(
                (changed as any).changed!.before,
                (changed as any).changed!.after,
                this.providedContext,
                docsHelper,
              ),
          ),
        );
      },
    };

    return handlers;
  }

  get specification() {
    const change: IChange = {
      location: {
        conceptualLocation: { path: "This Specification", method: "" },
        jsonPath: "/",
        conceptualPath: [],
        kind: "API",
      },
    } as any;

    const value: ShouldOrMust<
      (
        document: OpenAPIV3.Document,
        context: SynkApiCheckContext,
        docs: DocsLinkHelper,
      ) => Promise<void> | void
    > = {
      must: (statement, handler) => {
        const docsHelper = newDocsLinkHelper();
        this.checks.push(
          runCheck(
            change,
            docsHelper,
            "this specification: ",
            statement,
            true,
            () => handler(this.nextJsonLike, this.providedContext, docsHelper),
          ),
        );
      },
    };

    return {
      requirement: value,
    };
  }

  get request() {
    const dsl = this;

    return {
      queryParameter: genericEntityRuleImpl<
        OpenApiKind.QueryParameter,
        QueryParameterLocation,
        SynkApiCheckContext,
        OpenAPIV3.ParameterObject
      >(
        OpenApiKind.QueryParameter,
        dsl.changelog,
        dsl.nextFacts,
        (query) => `${query.name}`,
        (location) =>
          dsl.getOperationContext(location) as QueryParameterLocation &
            SynkApiCheckContext & { isSingletonPath: boolean },
        (...items) => dsl.checks.push(...items),
        (pointer: string) => jsonPointerHelpers.get(dsl.nextJsonLike, pointer),
      ),
      pathParameter: genericEntityRuleImpl<
        OpenApiKind.PathParameter,
        PathParameterLocation,
        SynkApiCheckContext,
        OpenAPIV3.ParameterObject
      >(
        OpenApiKind.PathParameter,
        dsl.changelog,
        dsl.nextFacts,
        (path) => `${path.name}`,
        (location) =>
          dsl.getOperationContext(location) as PathParameterLocation &
            SynkApiCheckContext & { isSingletonPath: boolean },
        (...items) => dsl.checks.push(...items),
        (pointer: string) => jsonPointerHelpers.get(dsl.nextJsonLike, pointer),
      ),
      header: genericEntityRuleImpl<
        OpenApiKind.HeaderParameter,
        HeaderParameterLocation,
        SynkApiCheckContext & { isSingletonPath: boolean },
        OpenAPIV3.ParameterObject
      >(
        OpenApiKind.HeaderParameter,
        dsl.changelog,
        dsl.nextFacts,
        (header) => `${header.name}`,
        (location) =>
          dsl.getOperationContext(location) as HeaderParameterLocation &
            SynkApiCheckContext & { isSingletonPath: boolean },
        (...items) => dsl.checks.push(...items),
        (pointer: string) => jsonPointerHelpers.get(dsl.nextJsonLike, pointer),
      ),
    };
  }

  get responses() {
    const dsl = this;

    return {
      ...genericEntityRuleImpl<
        OpenApiKind.Response,
        ResponseLocation,
        SynkApiCheckContext & {
          isSingletonPath: boolean;
          requestDataPropertyIsArray: boolean;
        },
        OpenAPIV3.ResponsesObject
      >(
        OpenApiKind.Response,
        dsl.changelog,
        dsl.nextFacts,
        (response) => `${response.statusCode}`,
        (location) => {
          const dataPath = [
            ...jsonPointerHelpers.decode(location.jsonPath).slice(0, 3),
            "requestBody",
            "content",
            "application/vnd.api+json",
            "schema",
            "properties",
            "data",
          ];

          const dataProperty = jsonPointerHelpers.tryGet(
            dsl.nextJsonLike,
            jsonPointerHelpers.compile(dataPath),
          );

          const requestDataPropertyIsArray =
            dataProperty.match && (dataProperty.value as any).type === "array";

          return {
            ...dsl.getOperationContext(location),
            requestDataPropertyIsArray,
          } as any;
        },
        (...items) => dsl.checks.push(...items),
        (pointer: string) => jsonPointerHelpers.get(dsl.nextJsonLike, pointer),
      ),
      headers: genericEntityRuleImpl<
        OpenApiKind.ResponseHeader,
        ResponseHeaderLocation,
        SynkApiCheckContext,
        OpenAPIV3.HeaderObject
      >(
        OpenApiKind.ResponseHeader,
        dsl.changelog,
        dsl.nextFacts,
        (header) => `${header.name}`,
        (location) =>
          dsl.getOperationContext(location) as ResponseHeaderLocation &
            SynkApiCheckContext & { isSingletonPath: boolean },
        (...items) => dsl.checks.push(...items),
        (pointer: string) => jsonPointerHelpers.get(dsl.nextJsonLike, pointer),
      ),
    };
  }

  get checkApiContext(): ShouldOrMust<
    (
      context: SynkApiCheckContext & { wasDeleted: boolean },
      docs: DocsLinkHelper,
    ) => void
  > {
    const contextChangedHandler: (
      must: boolean,
    ) => ContextChangedRule["must"] = (must: boolean) => {
      return (statement, handler) => {
        const docsHelper = newDocsLinkHelper();
        const syntheticChange: IChange = {
          added: this.providedContext as any,
          changeType: ChangeType.Added,
          location: {
            jsonPath: "/",
            conceptualPath: [],
            conceptualLocation: {
              path: "Entire Resource",
              method: "",
            },
            kind: "ContextRule",
          } as any,
        };
        this.checks.push(
          runCheck(
            syntheticChange,
            docsHelper,
            "api lifeycle: ",
            statement,
            must,
            () =>
              handler(
                {
                  ...this.providedContext,
                  wasDeleted: Boolean(
                    this.nextJsonLike["x-optic-ci-empty-spec"],
                  ),
                },
                docsHelper,
              ),
          ),
        );
      };
    };

    return {
      must: contextChangedHandler(true),
    };
  }

  get bodyProperties(): SnykEntityRule<
    OpenApiFieldFact,
    OpenAPIV3.SchemaObject
  > {
    const dsl = this;
    return genericEntityRuleImpl<
      OpenApiKind.Field,
      FieldLocation,
      SynkApiCheckContext,
      OpenAPIV3.SchemaObject
    >(
      OpenApiKind.Field,
      dsl.changelog,
      dsl.nextFacts,
      (field) => `${field.key}`,
      (location) =>
        dsl.getOperationContext(location) as FieldLocation &
          SynkApiCheckContext & { isSingletonPath: boolean },
      (...items) => dsl.checks.push(...items),
      (pointer: string) => jsonPointerHelpers.get(dsl.nextJsonLike, pointer),
    );
  }
}

type ContextChangedRule = ShouldOrMust<
  (
    context: SynkApiCheckContext & { wasDeleted: boolean },
    docs: DocsLinkHelper,
  ) => void
>;
