import { Button, Card, H5, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';

import { data } from '../../state/generator.ts';
import { navigate } from '../../state/router.ts';

import type { NewsEntry } from './news.ts';
import { NEWS } from './news.ts';

/**
 * What changed in the service, newest first, with a way to go and see each of
 * them rather than take the entry's word for it.
 * @returns The news page component.
 */
export default function NewsPage() {
  return (
    <div className="news">
      <Card>
        <div className="card-header">
          <H5>News</H5>
          <Tag minimal>{NEWS.length} entries</Tag>
        </div>
        <p className="muted">
          The service enumerates the isomers of a formula with surge, and asks
          you to find them yourself. Here is what it has learnt to do.
        </p>
      </Card>

      {NEWS.map((entry) => (
        <NewsCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function NewsCard(props: { entry: NewsEntry }) {
  useSignals();
  const { id, date, title, summary, body, showsSurgeVersion, link } =
    props.entry;
  const version = data.surgeVersion.value;

  return (
    <Card data-testid={`news-${id}`}>
      <div className="card-header">
        <H5>{title}</H5>
        <div className="news-tags">
          {showsSurgeVersion && version ? (
            <Tag minimal intent="primary">
              surge {version}
            </Tag>
          ) : null}
          <Tag minimal>{date}</Tag>
        </div>
      </div>
      <p className="news-summary">{summary}</p>
      {body.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}
      {link ? (
        <Button
          icon="arrow-right"
          text={link.label}
          onClick={() => navigate(link.page, link.parameters)}
        />
      ) : null}
    </Card>
  );
}
