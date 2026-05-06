from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('groups', '0002_rename_make_webhook_url_group_n8n_webhook_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='group',
            name='plan_tier',
            field=models.CharField(
                choices=[('starter', 'Starter'), ('growth', 'Growth'), ('pro', 'Pro'), ('any', 'Any')],
                db_index=True,
                default='starter',
                max_length=10,
            ),
        ),
    ]
