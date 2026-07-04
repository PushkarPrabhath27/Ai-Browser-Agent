/**
 * Brand helper: nominal typing for primitives that need cross-subsystem identity.
 *
 * `Brand<K, T>` produces `K` at runtime (it is a pure type-level construct) but
 * introduces a phantom `__brand` property so that the TypeScript checker will
 * refuse to substitute one branded string for another.
 *
 * See ADR-0002 for the rationale (no implicit `any`, no stringly-typed IDs crossing
 * subsystem boundaries — neither compile nor runtime safety is sacrificed).
 *
 * Example:
 *   type UserId = Brand<string, "UserId">;
 *   const id = "abc" as UserId;            // explicit, at the trust boundary
 *   function f(id: UserId) {}
 *   f("abc");                              // type error
 *   f(id);                                 // ok
 */
export type Brand<K, T> = K & { readonly __brand: T };
