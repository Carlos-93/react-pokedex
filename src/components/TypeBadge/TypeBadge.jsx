import { TYPES } from '../../data/types';
// Styles
import styles from './TypeBadge.module.css';

export default function TypeBadge({ type }) {
    return (
        <span className={styles.badge} style={{ '--type-color': TYPES[type]?.color }}>
            {TYPES[type]?.label ?? type}
        </span>
    );
}