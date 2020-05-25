import { Node } from "./Node";
import { Entity } from "../binding";

export type MatchType = 'match' | 'add' | 'change' | 'changeIndex' | 'remove';
export type Operation = 'insert' | 'update' | 'delete' | 'none';

/**
 * An event for a real-time query.
 */
export type RealtimeEvent<T extends Entity> = {
    /**
     * the query on which .eventStream([options]) was invoked
     */
    target: Node<T>;

    /**
     * the database entity this event was generated for, e.g. an entity that just entered or left the result set
     */
    data: T;

    /**
     * the operation by which the entity was altered
     * 'none' if unknown or not applicable
     */
    operation: Operation;

    /**
     * indicates how the transmitted entity relates to the query result.
     Every event is delivered with one of the following match types:
     <ul>
     <li> 'match': the entity matches the query. </li>
     <li> 'add': the entity entered the result set, i.e. it did not match before and is matching now. </li>
     <li> 'change': the entity was updated, but remains a match </li>
     <li> 'changeIndex' (for sorting queries only): the entity was updated and remains a match, but changed its position
     within the query result </li>
     <li> 'remove': the entity was a match before, but is not matching any longer </li>
     </ul>
     */
    matchType: MatchType;

    /**
     * a boolean value indicating whether this event reflects the matching status at query time (true) or a recent change
     * data change (false)
     */
    initial: boolean;

    /**
     * for sorting queries only: the position of the matching entity in the ordered result (-1 for non-matching entities)
     */
    index: number;

    /**
     * server-time from the instant at which the event was generated
     */
    date: Date;
}



