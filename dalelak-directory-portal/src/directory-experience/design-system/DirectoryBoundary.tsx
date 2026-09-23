import React from 'react';

export class DirectoryBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <section className="directory-empty" role="alert"><h1>تعذر عرض هذه الصفحة</h1><p>يمكنك إعادة تحميل الصفحة والمحاولة مجددًا.</p><button className="directory-button" onClick={() => window.location.reload()}>إعادة تحميل الصفحة</button></section> : this.props.children;
  }
}
